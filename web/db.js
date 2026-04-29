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
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER || "web",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "appdb",
  password: process.env.DB_PASSWORD || "password",
  port: 5432,
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDb() {
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ DB ready");
      return;
    } catch (err) {
      console.log("⏳ waiting for DB...");
      await sleep(2000);
    }
  }

  throw new Error("❌ DB not reachable after timeout");
}

async function initDb() {
  await waitForDb();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu (
      id SERIAL PRIMARY KEY,
      name_hu TEXT,
      name_en TEXT,
      url TEXT,
      type TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title_hu TEXT,
      title_en TEXT,
      content_hu TEXT,
      content_en TEXT,
      created_at TEXT,
      menu_id INTEGER
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS downloads (
      id SERIAL PRIMARY KEY,
      name_hu TEXT,
      name_en TEXT,
      link TEXT,
      description_hu TEXT,
      description_en TEXT,
      file_path TEXT,
      file_size_mb NUMERIC(10,2) DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      menu_id INTEGER
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guestbook (
      id SERIAL PRIMARY KEY,
      name TEXT,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      ip TEXT,
      visited_at DATE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      title_hu TEXT,
      title_en TEXT,
      image_path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      menu_id INTEGER
    );
  `);

  const lastUpdate = await pool.query(
    "SELECT key FROM settings WHERE key = 'last_update'"
  );

  if (lastUpdate.rows.length === 0) {
    const today = new Date().toISOString().split("T")[0];

    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2)",
      ["last_update", today]
    );

    console.log("✅ last_update created:", today);
  }

  const menuCount = await pool.query("SELECT COUNT(*) FROM menu");

  if (parseInt(menuCount.rows[0].count) === 0) {
    await pool.query(
      "INSERT INTO menu (name_hu, name_en, url, type, sort_order) VALUES ($1,$2,$3,$4,$5)",
      ["Főoldal", "Home", "/", "article", 0]
    );

    await pool.query(
      "INSERT INTO menu (name_hu, name_en, url, type, sort_order) VALUES ($1,$2,$3,$4,$5)",
      ["Vendégkönyv", "Guestbook", "/guestbook", "article", 1]
    );

    console.log("✅ Base menus created");
  }

  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const existingAdmin = await pool.query(
    "SELECT key FROM settings WHERE key = 'admin_user'"
  );

  if (existingAdmin.rows.length === 0) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2)",
      ["admin_user", adminUser]
    );


    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2)",
      ["admin_password", hashedPassword]
    );

    console.log("✅ admin user seeded into DB (bcrypt hash)");
  }
}

initDb().catch((err) => {
  console.error("❌ DB init error:", err);
});

module.exports = pool;
