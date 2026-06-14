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
const express = require("express");
const session = require("express-session");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const db = require("./db");
const app = express();
app.set("trust proxy", true);
const logger = require("./logger");

/* ======================
   CSP HEADER
====================== */
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
  );
  next();
});

/* ======================
   ANTI BOT
====================== */

const badPatterns = [

  /* =========================
     CORE DANGER (.env / git)
  ========================= */
  /\.env/i,
  /\.git/i,
  /\.git\/config/i,
  /\.env\./i,

  /* =========================
     PHP / WEB SHELL SCANS
  ========================= */
  /\.php/i,
  /shell/i,
  /cmd/i,
  /command/i,
  /backdoor/i,
  /upload/i,
  /uploads/i,
  /wso/i,
  /r57/i,
  /c99/i,
  /eval/i,
  /assert/i,

  /* =========================
     WORDPRESS EXPLOIT SCANS
  ========================= */
  /wp-content/i,
  /wp-admin/i,
  /wp-includes/i,
  /wp-login/i,
  /wp-json/i,
  /wp-config/i,
  /xmlrpc/i,
  /wordpress/i,
  /wp-/i,

  /* =========================
     COMMON CMS / FRAMEWORK TARGETS
  ========================= */
  /joomla/i,
  /drupal/i,
  /magento/i,
  /laravel/i,
  /symfony/i,
  /thinkphp/i,
  /codeigniter/i,

  /* =========================
     DEBUG / DEV LEAK TARGETS
  ========================= */
  /debug/i,
  /dev/i,
  /test/i,
  /staging/i,
  /stage/i,
  /local/i,
  /env/i,
  /info\.php/i,
  /phpinfo/i,
  /telescope/i,
  /horizon/i,
  /actuator/i,
  /profiler/i,

  /* =========================
     CONFIG / SECRET SEARCH
  ========================= */
  /config/i,
  /configuration/i,
  /settings/i,
  /credentials/i,
  /secret/i,
  /secrets/i,
  /token/i,
  /keys/i,
  /key/i,
  /database/i,
  /db/i,

  /* =========================
     BACKUP / FILE LEAK SCANS
  ========================= */
  /\.bak/i,
  /\.old/i,
  /\.backup/i,
  /\.save/i,
  /\.swp/i,
  /\.tmp/i,
  /\.zip/i,
  /\.tar/i,
  /\.gz/i,
  /\.sql/i,
  /\.7z/i,
  /\.rar/i,

  /* =========================
     ADMIN / LOGIN TARGETS
  ========================= */
  /admin/i,
  /login/i,
  /signin/i,
  /auth/i,
  /dashboard/i,
  /cpanel/i,
  /panel/i,

  /* =========================
     SERVER / INFRA SCANS
  ========================= */
  /server-status/i,
  /status/i,
  /metrics/i,
  /health/i,
  /monitor/i,

  /* =========================
     EXPLOIT / ATTACK WORDS
  ========================= */
  /exploit/i,
  /payload/i,
  /hack/i,
  /inject/i,
  /injection/i,
  /scan/i,
  /scanner/i,
  /probe/i,

  /* =========================
     RANDOM BOT MASS SCANS
  ========================= */
  /this_is_a_test/i,
  /hello_world/i,
  /random/i,
  /test123/i,
  /asdf/i,

];

app.use((req, res, next) => {
  const url = req.originalUrl;

  if (badPatterns.some(r => r.test(url))) {
    return res.status(404).end();
  }

  next();
});

const ipScore = new Map();

app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  const url = req.originalUrl;

  let score = ipScore.get(ip) || 0;

  if (/\.env|\.git|wp-|\.php|filemanager/i.test(url)) {
    score += 5;
  }

  if (score > 10) {
    return res.status(404).end();
  }

  ipScore.set(ip, score);

  next();
});

/* ======================
   MIDDLEWARE
====================== */
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
//  secret: "secret123",
  resave: false,
  saveUninitialized: true
}));
/* ======================
   VIEW ENGINE
====================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout");
/* ======================
   STATIC
====================== */
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/data", express.static("/app/data"));
app.use("/uploads", express.static("/app/data/uploads"));
app.use("/static", express.static("node_modules"));
/* ======================
   GLOBAL MENU + SETTINGS
====================== */
app.use(async (req, res, next) => {
  try {
    const lang = req.session.lang || "en";

    // MENU
    const menuResult = await db.query(
      "SELECT * FROM menu ORDER BY sort_order ASC, id ASC"
    );

    const rows = menuResult.rows || [];

    res.locals.menu = rows.map(m => ({
      ...m,
      name: lang === "en" ? m.name_en : m.name_hu
    }));

    res.locals.menuRaw = rows;

    const result = await db.query(
      "SELECT key, value FROM settings"
    );

    const map = {};
    for (const r of result.rows) {
      map[r.key] = r.value;
    }

    res.locals.lastUpdate = map.last_update || "";
    res.locals.firstStart = map.first_start || "";
    res.locals.site_title = map.site_title || "AlexCMS";
    res.locals.meta_description = map.meta_description || "";
    res.locals.meta_keywords = map.meta_keywords || "";

    next();

  } catch (err) {
    console.error("GLOBAL ERROR:", err);

    res.locals.menu = [];
    res.locals.menuRaw = [];
    res.locals.lastUpdate = "";
    res.locals.firstStart = "";
    res.locals.siteTitle = "AlexCMS";

    next();
  }
});
/* ======================
   LANGUAGE + USER
====================== */
app.use((req, res, next) => {
  req.session.lang = req.session.lang || "en";

  res.locals.lang = req.session.lang;
  res.locals.user = req.session.user || null;

  next();
});
/* ======================
   STATS CACHE
====================== */
let statsCache = {
  total: 0,
  today: 0,
  avg: 0,
  ts: 0
};

const STATS_TTL = 10 * 1000;

app.use(async (req, res, next) => {
  try {
    const now = Date.now();

    if (now - statsCache.ts < STATS_TTL) {
      res.locals.stats = {
        total: statsCache.total,
        today: statsCache.today,
        avg: statsCache.avg
      };
      return next();
    }

    const ipRaw = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ip = ipRaw.split(",")[0].trim(); // FIX proxy bug

    const today = new Date().toISOString().split("T")[0];

    await db.query(
      `INSERT INTO visits (ip, visited_at)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM visits WHERE ip=$1 AND visited_at=$2
       )`,
      [ip, today]
    );

    const [total, todayCount, avg] = await Promise.all([
      db.query("SELECT COUNT(*) FROM visits"),
      db.query("SELECT COUNT(*) FROM visits WHERE visited_at=$1", [today]),
      db.query(`
        SELECT AVG(daily) FROM (
          SELECT COUNT(*) as daily
          FROM visits
          GROUP BY visited_at
        ) t
      `)
    ]);

    statsCache = {
      total: total.rows[0].count,
      today: todayCount.rows[0].count,
      avg: Math.round(avg.rows[0].avg || 0),
      ts: now
    };

    res.locals.stats = statsCache;

    next();

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.locals.stats = { total: 0, today: 0, avg: 0 };
    next();
  }
});
/* ======================
   INIT
====================== */
(async () => {
  try {

    const check = await db.query(
      "SELECT value FROM settings WHERE key='first_start'"
    );

    if (check.rows.length === 0) {
      const today = new Date().toISOString().split("T")[0];

      await db.query(
        "INSERT INTO settings (key,value) VALUES ($1,$2)",
        ["first_start", today]
      );

    }

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
})();
/* ======================
   LOGGER
====================== */
app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress

  logger.info("request", {
    method: req.method,
    url: req.url,
    ip,
    role: req.session.user?.role || "guest",
  });

  next();
});

app.use((err, req, res, next) => {
  logger.error("server error", {
    message: err.message,
    stack: err.stack,
    url: req.url
  });

  res.status(500).send("Server error");
});
/* ======================
   ROUTES
====================== */
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.sendFile(path.join(__dirname, "public/robots.txt"));
});
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.sendFile(path.join(__dirname, "public/sitemap.xml"));
});
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/guestbook", require("./routes/guestbook"));
app.use("/", require("./routes/main"));

/* ======================
   START
====================== */
app.listen(80, () => console.log("http://localhost:80"));
