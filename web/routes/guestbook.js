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
/* ======================
   GET GUESTBOOK
====================== */
router.get("/", async (req, res) => {
  try {
    const lang = req.session.lang || "en";

    const result = await db.query(
      "SELECT * FROM guestbook ORDER BY id DESC"
    );

    const pageMenu = {
      name: lang === "en" ? "Guestbook" : "Vendégkönyv"
    };

    res.render("guestbook", {
      messages: result.rows || [],
      pageMenu
    });

  } catch (err) {
    console.error("GUESTBOOK ERROR:", err);

    res.render("guestbook", {
      messages: [],
      pageMenu: {
        name: "Guestbook"
      }
    });
  }
});
/* ======================
   POST MESSAGE
====================== */
router.post("/", async (req, res) => {
  try {
    await db.query(
      "INSERT INTO guestbook (name, message) VALUES ($1, $2)",
      [req.body.name, req.body.message]
    );

    res.redirect("/guestbook");

  } catch (err) {
    console.error("INSERT ERROR:", err);
    res.redirect("/guestbook");
  }
});

module.exports = router;
