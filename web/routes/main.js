/*
#############################################################
#     ▄▄    ▄▄             ▄   ▄▄▄▄  ▄▄▄     ▄▄▄    ▄▄▄▄▄   #
#   ▄█▀▀█▄   ██            ▀██████▀   ███▄ ▄███    ██▀▀▀▀█▄ #
#   ██  ██   ██              ██       ██ ▀█▀ ██    ▀██▄  ▄▀ #
#   ██▀▀██   ██ ▄█▀█▄▀██ ██▀ ██       ██     ██      ▀██▄▄  #
# ▄ ██  ██   ██ ██▄█▀  ███   ██       ██     ██    ▄   ▀██▄ #
# ▀██▀  ▀█▄█▄██▄▀█▄▄▄▄██ ██▄ ▀█████ ▀██▀     ▀██▄  ▀██████▀ #
#############################################################
*/
const router = require("express").Router();
const db = require("/app/web/db");
const fs = require("fs");
const path = require("path");
/* =========================
   INDEX
========================= */
router.get("/", (req, res) => {
  res.render("index");
});
/* =========================
   PRIVACY
========================= */
router.get("/privacy", async (req, res) => {
  const settingsRes = await db.query(
    "SELECT key, value FROM settings"
  );

  const settings = {};
  settingsRes.rows.forEach(s => {
    settings[s.key] = s.value;
  });

  res.render("privacy", {
    lang: req.session.lang || "en",
    settings
  });
});
/* =========================
   LANGUAGE SWITCH
========================= */
router.get("/lang/:lang", (req, res) => {
  req.session.lang = req.params.lang;
  res.redirect(req.get("Referrer") || "/");
});
/* =========================
   MAIN ROUTE
========================= */
router.get("/:slug", async (req, res) => {
  try {
    const menuResult = await db.query(
      "SELECT * FROM menu WHERE url = $1",
      [req.params.slug]
    );

    const menu = menuResult.rows[0];

    if (!menu) {
      return res.status(404).send("No page found");
    }

    const lang = req.session.lang || "hu";
    const menuName = lang === "en" ? menu.name_en : menu.name_hu;
    /* =========================
       ARTICLE
    ========================= */
    if (menu.type === "article") {

        const articlesResult = await db.query(
            "SELECT * FROM articles WHERE menu_id = $1 ORDER BY id DESC",
            [menu.id]
        );

        const settingsRes = await db.query(
            "SELECT key, value FROM settings"
        );

        const settings = {};
        settingsRes.rows.forEach(s => {
            settings[s.key] = s.value;
        });

        const translated = (articlesResult.rows || []).map(a => ({
            ...a,
            title: lang === "en" ? a.title_en : a.title_hu,
            content: lang === "en" ? a.content_en : a.content_hu
        }));

        return res.render("article", {
            articles: translated,
            pageMenu: {
                ...menu,
                name: menuName
            },
            lang,
            user: req.session.user,
            settings
        });
    }
    /* =========================
       DOWNLOAD
    ========================= */
    if (menu.type === "download") {
      const filesResult = await db.query(
        "SELECT * FROM downloads WHERE menu_id = $1",
        [menu.id]
      );

      const filesWithData = (filesResult.rows || []).map(f => {

        const name = lang === "en" ? f.name_en : f.name_hu;
        const description = lang === "en" ? f.description_en : f.description_hu;
        const size = f.file_size_mb ? f.file_size_mb + " MB" : "N/A";

        return {
          ...f,
          name,
          description,
          size
        };
      });

      return res.render("downloads", {
        files: filesWithData,
        pageMenu: {
          ...menu,
          name: menuName
        },
        lang
      });
    }
    /* =========================
       GALLERY
    ========================= */
    if (menu.type === "gallery") {
      const galleryResult = await db.query(
        "SELECT * FROM gallery WHERE menu_id = $1 ORDER BY id DESC",
        [menu.id]
      );

      return res.render("gallery", {
        gallery: galleryResult.rows || [],
        pageMenu: {
          ...menu,
          name: menuName
        },
        lang
      });
    }

    return res.status(404).send("Unknown filetype");

  } catch (err) {
    console.error("MAIN ROUTE ERROR:", err);
    res.status(500).send("Server error");
  }
});
/* =========================
   DOWNLOAD ROUTE
========================= */
router.get("/download/:id", async (req, res) => {
  try {
    const fileResult = await db.query(
      "SELECT * FROM downloads WHERE id = $1",
      [req.params.id]
    );

    const file = fileResult.rows[0];

    if (!file) return res.send("File not existing");

    await db.query(
      "UPDATE downloads SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1",
      [file.id]
    );

    if (file.file_path) {
      const fullPath = path.join(
        "/app/data/",
        file.file_path
      );

      return res.download(fullPath, (err) => {
        if (err) {
          console.log("DOWNLOAD ERROR:", err);
          res.status(500).send("Error in download");
        }
      });
    }

    if (file.link) {
      return res.redirect(file.link);
    }

    res.send("No files found");

  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
