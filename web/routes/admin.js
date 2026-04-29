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
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { translate } = require("@vitalets/google-translate-api");
const sanitizeHtml = require("sanitize-html");
const { HttpProxyAgent } = require('http-proxy-agent');
const bcrypt = require("bcrypt");

/* ======================
   HTML SANITIZER
====================== */
function cleanHtml(html) {
  return sanitizeHtml(html || "", {
    allowedTags: [
      'p','br',
      'strong','b',
      'em','i',
      'u','s',
      'h1','h2','h3','h4','h5','h6',
      'blockquote',
      'pre','code',
      'ul','ol','li',
      'span',
      'a',
      'img'
    ],

    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      span: ['style'],
      p: ['style'],
      h1: ['style'],
      h2: ['style'],
      h3: ['style'],
      h4: ['style'],
      h5: ['style'],
      h6: ['style']
    },

    allowedSchemes: ['http', 'https', 'data'],

    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer'
      })
    },

    disallowedTagsMode: 'discard'
  });
}
/* ======================
   TRANSLATE || WITHOUT PROXY
====================== 
async function toEn(text) {
  if (!text) return "";
  const res = await translate(text, { to: "en" });
  return res.text;
//return text; // IF TOO MANY TRY
}*/
/* ======================
   TRANSLATE || WITH PROXY
====================== */
let PROXIES = [];
let proxyIndex = 0;
const TIMEOUT_MS = 8000;
let lastUpdate = 0;

async function updateProxies() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    console.log('📥 Proxy list downloading...');
    const response = await globalThis.fetch(
      'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=ipport&format=text&timeout=10000',
      { signal: controller.signal }
    );

    const data = await response.text();
    clearTimeout(timeoutId);

    PROXIES = data
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const match = line.match(/\[http:\/\/([^\]]+)\]/);
        return match ? match[1] : line;
      })
      .filter(line => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/.test(line));

    console.log(`✅ ${PROXIES.length} proxy loaded: ${PROXIES.slice(0,3).join(', ')}...`);
    lastUpdate = Date.now();
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('❌ Proxy API failed:', e.message);
  }
}

async function toEn(text) {
  if (!text || text.trim() === "") return "";

  try {
    console.log('🌍 Direct request...');

    const res = await translate(text, { to: 'en' });

    console.log('✅ Direct translate OK');
    return res.text;

  } catch (error) {
    console.log('⚠ Direct failed, proxy fallback...');
  }

  if (Date.now() - lastUpdate > 3600000) {
    await updateProxies();
  }

  if (PROXIES.length === 0) {
    console.warn('⚠ No proxy, no translation.');
    return text;
  }

  let retries = 0;

  for (let i = 0; i < PROXIES.length; i++) {
    const proxy = PROXIES[proxyIndex % PROXIES.length];
    proxyIndex = (proxyIndex + 1) % PROXIES.length;

    console.log(`🌐 Proxy: ${proxy}`);

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

    try {
      const res = await translate(text, {
        to: 'en',
        fetchOptions: {
          agent: new HttpProxyAgent(`http://${proxy}`),
          signal: ac.signal,
        }
      });

      clearTimeout(timer);
      console.log(`✅ Proxy translate OK`);
      return res.text;

    } catch (error) {
      clearTimeout(timer);
      retries++;

      if (error.name === 'AbortError') {
        console.log(`⏰ Timeout: ${proxy}`);
      } else if (error.name === 'TooManyRequestsError') {
        console.log(`🚫 Rate limit: ${proxy}`);
      }
    }
  }

  console.error('❌ ALL proxy failed');
  return text;
}
/* ======================
   TITLE
====================== */
router.post("/settings/update", auth, async (req, res) => {
  const { site_title } = req.body;
  
  await db.query(
    "INSERT INTO settings (key, value) VALUES ('site_title', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
    [site_title || 'AlexCMS']
  );
  await updateDate();
  res.redirect("/admin");
});

updateProxies().then(() => {
  console.log('🚀 Proxy rendszer aktív!');
});
/* ======================
   META SETTINGS
====================== */
router.post("/settings/seo", auth, async (req, res) => {
  const { meta_description, meta_keywords } = req.body;

  await db.query("INSERT INTO settings (key, value) VALUES ('meta_description', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
    [meta_description || ""]
  );

  await db.query("INSERT INTO settings (key, value) VALUES ('meta_keywords', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
    [meta_keywords || ""]
  );

  await updateDate();
  res.redirect("/admin");
});
/* ======================
   UPDATE DATE
====================== */
async function updateDate() {
  const today = new Date().toISOString().split("T")[0];

  await db.query(
    "UPDATE settings SET value = $1 WHERE key = 'last_update'",
    [today]
  );
}
/* ======================
   DATA STRUCTURE
====================== */
const BASE_DIR = path.join(__dirname, "/app/data");
const DOWNLOAD_DIR = "/app/data/uploads";
const PICTURE_DIR = "/app/data/pictures";

[BASE_DIR, DOWNLOAD_DIR, PICTURE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
/* ======================
   MULTER STORAGE
====================== */
const downloadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOWNLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const pictureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PICTURE_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const uploadDownload = multer({ storage: downloadStorage });
const uploadImage = multer({ storage: pictureStorage });
/* ======================
   AUTH
====================== */
function auth(req, res, next) {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
}
/* ======================
   IMAGE UPLOAD
====================== */
router.post("/upload", auth, uploadImage.single("upload"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });

  res.json({
    url: "/data/pictures/" + req.file.filename
  });
});
/* ======================
   ADMIN HOME
====================== */
router.get("/", auth, async (req, res) => {
  const lang = req.session.lang || "en";

  const result = await db.query(
    "SELECT * FROM menu ORDER BY sort_order ASC, id ASC"
  );

  const menus = (result.rows || []).map(m => ({
    ...m,
    name: lang === "en" ? m.name_en : m.name_hu
  }));

  res.render("admin", {
    menu: menus,
    lang
  });
});
/* ======================
   MENU EDIT
====================== */
router.post("/menu", auth, async (req, res) => {
  const name_hu = req.body.name;
  const name_en = await toEn(req.body.name);
  const max = await db.query(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM menu"
  );

  const sort_order = max.rows[0].next;

  await db.query("INSERT INTO menu (name_hu, name_en, url, type, sort_order) VALUES ($1,$2,$3,$4,$5)",
    [name_hu, name_en, req.body.url, req.body.type, sort_order]
  );

  await updateDate();
  res.redirect("/admin");
});

router.get("/menu/edit/:id", auth, async (req, res) => {
  const menu = (await db.query("SELECT * FROM menu WHERE id=$1", [req.params.id])).rows[0];
  if (!menu) return res.redirect("/admin");

  const articles = (await db.query(
    "SELECT * FROM articles WHERE menu_id=$1 ORDER BY id DESC",
    [req.params.id]
  )).rows;

  const downloads = (await db.query(
    "SELECT * FROM downloads WHERE menu_id=$1 ORDER BY id DESC",
    [req.params.id]
  )).rows;

  const gallery = (await db.query(
    "SELECT * FROM gallery WHERE menu_id=$1 ORDER BY id DESC",
    [req.params.id]
  )).rows;

  res.render("menu_edit", {
    menu,
    articles,
    downloads,
    gallery,
    editGallery: null,
    editArticle: null,
    editDownload: null
  });
});

/* ======================
   MENU UPDATE
====================== */
router.post("/menu/edit/:id", auth, async (req, res) => {
  const name_hu = req.body.name;
  const name_en = await toEn(req.body.name);

  await db.query("UPDATE menu SET name_hu=$1, name_en=$2, url=$3, type=$4 WHERE id=$5",
    [name_hu, name_en, req.body.url, req.body.type, req.params.id]
  );

  await updateDate();
  res.redirect("/admin");
});

/* ======================
   MENU DELETE
====================== */
router.post("/menu/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    await db.query("DELETE FROM articles WHERE menu_id=$1", [id]);
    await db.query("DELETE FROM downloads WHERE menu_id=$1", [id]);
    await db.query("DELETE FROM gallery WHERE menu_id=$1", [id]);

    await db.query("DELETE FROM menu WHERE id=$1", [id]);

    await updateDate();
    res.redirect("/admin");

  } catch (err) {
    console.error("MENU DELETE ERROR:", err);
    res.redirect(req.get("Referrer") || "/admin");
  }
});
/* ======================
   MENU UP
====================== */
router.get("/menu/up/:id", auth, async (req, res) => {
  const itemRes = await db.query("SELECT * FROM menu WHERE id = $1", [req.params.id]);
  const item = itemRes.rows[0];

  if (!item) return res.redirect("/admin");

  const prevRes = await db.query("SELECT * FROM menu WHERE sort_order < $1 ORDER BY sort_order DESC LIMIT 1",
    [item.sort_order]
  );

  const prev = prevRes.rows[0];
  if (!prev) return res.redirect("/admin");

  await db.query("UPDATE menu SET sort_order = $1 WHERE id = $2", [prev.sort_order, item.id]);
  await db.query("UPDATE menu SET sort_order = $1 WHERE id = $2", [item.sort_order, prev.id]);

  await updateDate();
  res.redirect("/admin");
});
/* ======================
   MENU DOWN
====================== */
router.get("/menu/down/:id", auth, async (req, res) => {
  const itemRes = await db.query("SELECT * FROM menu WHERE id = $1", [req.params.id]);
  const item = itemRes.rows[0];

  if (!item) return res.redirect("/admin");

  const nextRes = await db.query("SELECT * FROM menu WHERE sort_order > $1 ORDER BY sort_order ASC LIMIT 1",
    [item.sort_order]
  );

  const next = nextRes.rows[0];
  if (!next) return res.redirect("/admin");

  await db.query("UPDATE menu SET sort_order = $1 WHERE id = $2", [next.sort_order, item.id]);
  await db.query("UPDATE menu SET sort_order = $1 WHERE id = $2", [item.sort_order, next.id]);

  await updateDate();
  res.redirect("/admin");
});
/* ======================
   ARTICLE LOAD
====================== */
router.get("/articles/load/:id", auth, async (req, res) => {
  const article = (await db.query(
    "SELECT * FROM articles WHERE id=$1",
    [req.params.id]
  )).rows[0];

  if (!article) return res.redirect("/admin");

  const menu = (await db.query(
    "SELECT * FROM menu WHERE id=$1",
    [article.menu_id]
  )).rows[0];

  const articles = (await db.query(
    "SELECT * FROM articles WHERE menu_id=$1 ORDER BY id DESC",
    [article.menu_id]
  )).rows;

  const downloads = (await db.query(
    "SELECT * FROM downloads WHERE menu_id=$1 ORDER BY id DESC",
    [article.menu_id]
  )).rows;

  const gallery = (await db.query(
    "SELECT * FROM gallery WHERE menu_id=$1 ORDER BY id DESC",
    [article.menu_id]
  )).rows;

  res.render("menu_edit", {
    menu,
    articles,
    downloads,
    gallery,
    editGallery: null,
    editArticle: article,
    editDownload: null
  });
});
/* ======================
   ARTICLE CRUD
====================== */
router.post("/articles", auth, async (req, res) => {
  const { title, content, menu_id } = req.body;
  const cleanContent = cleanHtml(req.body.content);
  await db.query("INSERT INTO articles (title_hu,title_en,content_hu,content_en,menu_id,created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
    [title, await toEn(title), cleanContent, await toEn(cleanContent), menu_id]
  );

  await updateDate();
  res.redirect("/admin/menu/edit/" + menu_id);
});

router.post("/articles/:id", auth, async (req, res) => {
  const { title, content, menu_id } = req.body;
  const cleanContent = cleanHtml(req.body.content);
  await db.query("UPDATE articles SET title_hu=$1, title_en=$2, content_hu=$3, content_en=$4 WHERE id=$5",
    [title, await toEn(title), content, await toEn(cleanContent), req.params.id]
  );

  await updateDate();
  res.redirect("/admin/menu/edit/" + menu_id);
});

router.post("/articles/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const article = await db.query(
      "SELECT * FROM articles WHERE id=$1",
      [id]
    );

    if (!article.rows[0]) return res.redirect(req.get("Referrer") || "/admin");

    const html = article.rows[0].content_hu || "";

    const regex = /\/data\/pictures\/[a-zA-Z0-9\-\._]+/g;
    const images = html.match(regex) || [];

    await db.query("DELETE FROM articles WHERE id=$1", [id]);

    for (const img of images) {
      const filePath = path.join(__dirname, "/app/data", img);

      fs.unlink(filePath, err => {
        if (err) console.log("IMG DELETE ERROR:", err.message);
      });
    }

    res.redirect(req.get("Referrer") || "/admin");

  } catch (err) {
    console.error(err);
    res.redirect(req.get("Referrer") || "/admin");
  }
});
/* ======================
   DOWNLOADS
====================== */
router.post("/downloads", auth, uploadDownload.single("file"), async (req, res) => {
  if (!req.file) return res.redirect(req.get("Referrer") || "/admin");

  const filePath = "/uploads/" + req.file.filename;
  const cleanDescription = cleanHtml(req.body.description);
  const stats = fs.statSync(req.file.path);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

  await db.query("INSERT INTO downloads (name_hu,name_en,description_hu,description_en,file_path,file_size_mb,menu_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [req.body.name, await toEn(req.body.name), req.body.description, await toEn(cleanDescription), filePath, fileSizeMB, req.body.menu_id]
  );

  await updateDate();
  res.redirect("/admin/menu/edit/" + req.body.menu_id);
});

router.post("/downloads/:id", auth, async (req, res) => {
  const { name, description, menu_id } = req.body;
  const cleanDescription = cleanHtml(req.body.description);

  await db.query("UPDATE downloads SET name_hu=$1, name_en=$2, description_hu=$3, description_en=$4 WHERE id=$5",
    [name, await toEn(name), description, await toEn(cleanDescription), req.params.id]
  );

  await updateDate();
  res.redirect("/admin/menu/edit/" + menu_id);
});

router.post("/downloads/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db.query(
      "SELECT * FROM downloads WHERE id=$1",
      [id]
    );

    const file = result.rows[0];
    if (!file) return res.redirect(req.get("Referrer") || "/admin");

    await db.query("DELETE FROM downloads WHERE id=$1", [id]);

    if (file.file_path) {
      const filePath = path.join(
        __dirname,
        "/app/data/",
        file.file_path
      );

      fs.unlink(filePath, err => {
        if (err) console.log("DOWNLOAD DELETE FILE ERROR:", err.message);
      });
    }

    await updateDate();
    res.redirect(req.get("Referrer") || "/admin");

  } catch (err) {
    console.error("DOWNLOAD DELETE ERROR:", err);
    res.redirect(req.get("Referrer") || "/admin");
  }
});

router.get("/downloads/load/:id", auth, async (req, res) => {
  const download = (await db.query(
    "SELECT * FROM downloads WHERE id=$1",
    [req.params.id]
  )).rows[0];

  if (!download) return res.redirect("/admin");

  const menu = (await db.query(
    "SELECT * FROM menu WHERE id=$1",
    [download.menu_id]
  )).rows[0];

  const articles = (await db.query(
    "SELECT * FROM articles WHERE menu_id=$1 ORDER BY id DESC",
    [download.menu_id]
  )).rows;

  const downloads = (await db.query(
    "SELECT * FROM downloads WHERE menu_id=$1 ORDER BY id DESC",
    [download.menu_id]
  )).rows;

  const gallery = (await db.query(
    "SELECT * FROM gallery WHERE menu_id=$1 ORDER BY id DESC",
    [download.menu_id]
  )).rows;

  res.render("menu_edit", {
    menu,
    articles,
    downloads,
    gallery,
    editGallery: null,
    editArticle: null,
    editDownload: download
  });
});
/* ======================
   GALLERY
====================== */
router.post("/gallery", auth, uploadImage.single("image"), async (req, res) => {
  const filePath = req.file ? "/data/pictures/" + req.file.filename : null;
  if (!filePath) return res.status(400).send("no image");

  await db.query("INSERT INTO gallery (title_hu,title_en,image_path,menu_id) VALUES ($1,$2,$3,$4)",
    [req.body.title, await toEn(req.body.title), filePath, req.body.menu_id]
  );

  await updateDate();
  res.redirect("/admin/menu/edit/" + req.body.menu_id);
});

router.get("/gallery/load/:id", auth, async (req, res) => {
  const galleries = (await db.query(
    "SELECT * FROM gallery WHERE id=$1",
    [req.params.id]
  )).rows[0];

  if (!galleries) return res.redirect("/admin");

  const menu = (await db.query(
    "SELECT * FROM menu WHERE id=$1",
    [galleries.menu_id]
  )).rows[0];

  const articles = (await db.query(
    "SELECT * FROM articles WHERE menu_id=$1 ORDER BY id DESC",
    [galleries.menu_id]
  )).rows;

  const downloads = (await db.query(
    "SELECT * FROM downloads WHERE menu_id=$1 ORDER BY id DESC",
    [galleries.menu_id]
  )).rows;

  const gallery = (await db.query(
    "SELECT * FROM gallery WHERE menu_id=$1 ORDER BY id DESC",
    [galleries.menu_id]
  )).rows;

  res.render("menu_edit", {
    menu,
    articles,
    downloads,
    gallery,
    editGallery: galleries,
    editArticle: null,
    editDownload: null
  });
});

router.post("/gallery/:id", auth, async (req, res) => {
  const { title, menu_id } = req.body;

  await db.query("UPDATE gallery SET title_hu=$1, title_en=$2 WHERE id=$3",
    [title, await toEn(title), req.params.id]
  );

  await updateDate();
  res.redirect("/admin/menu/edit/" + menu_id);
});

router.post("/gallery/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const img = await db.query(
      "SELECT * FROM gallery WHERE id=$1",
      [id]
    );

    if (!img.rows[0]) return res.redirect(req.get("Referrer") || "/admin");

    const imagePath = img.rows[0].image_path; 

    await db.query("DELETE FROM gallery WHERE id=$1", [id]);

    if (imagePath) {
      const filePath = path.join(__dirname, "/app/data", "pictures", path.basename(imagePath));

      fs.unlink(filePath, err => {
        if (err) console.log("FILE DELETE ERROR:", err.message);
      });
    }

    res.redirect(req.get("Referrer") || "/admin");

  } catch (err) {
    console.error(err);
    res.redirect(req.get("Referrer") || "/admin");
  }
});
/* ======================
   GUESTBOOK DELETE
====================== */
router.post("/guestbook/delete/:id", auth, async (req, res) => {
  await db.query("DELETE FROM guestbook WHERE id = $1", [req.params.id]);

  res.redirect("/guestbook");
});
/* ======================
   UPDATE ADMIN PW
====================== */
router.post("/settings/password", auth, async (req, res) => {
  const { old_password, new_password, confirm_password } = req.body;

  if (!old_password || !new_password || !confirm_password) {
    return res.redirect("/admin");
  }

  if (new_password !== confirm_password) {
    return res.redirect("/admin");
  }

  // lekérjük az admin jelszót
  const result = await db.query(
    "SELECT value FROM settings WHERE key = 'admin_password'"
  );

  const storedHash = result.rows[0]?.value;
  if (!storedHash) return res.redirect("/admin");

  // régi jelszó ellenőrzés
  const ok = await bcrypt.compare(old_password, storedHash);
  if (!ok) return res.redirect("/admin");

  // új jelszó hash
  const newHash = await bcrypt.hash(new_password, 10);

  await db.query(
    "UPDATE settings SET value = $1 WHERE key = 'admin_password'",
    [newHash]
  );

  await updateDate();
  res.redirect("/admin");
});

module.exports = router;
