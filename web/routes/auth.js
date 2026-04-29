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
const pool = require("/app/web/db");
const bcrypt = require("bcrypt");
const svgCaptcha = require("svg-captcha");

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const { username, password, captcha } = req.body;

  if (!captcha || captcha !== req.session.captcha) {
    req.session.captcha = null;
    return res.status(400).send("Captcha hibás");
  }

  req.session.captcha = null;

  if (!req.session.loginAttempts) req.session.loginAttempts = 0;

  if (req.session.loginAttempts > 5) {
    return res.status(429).send("Túl sok próbálkozás");
  }

  try {
    const userRes = await pool.query(
      "SELECT value FROM settings WHERE key = 'admin_user'"
    );

    const passRes = await pool.query(
      "SELECT value FROM settings WHERE key = 'admin_password'"
    );

    const adminUser = userRes.rows[0]?.value;
    const adminPasswordHash = passRes.rows[0]?.value;

    const userOk = username === adminUser;
    const passOk = await bcrypt.compare(password, adminPasswordHash);

    if (userOk && passOk) {
      req.session.user = {
        username,
        role: "admin",
      };
      req.session.loginAttempts = 0;

      return res.redirect("/admin");
    }

    req.session.loginAttempts++;
    return res.status(401).send("Hibás adat");

  } catch (err) {
    console.error(err);
    return res.status(500).send("Szerver hiba");
  }
});
/* ======================
   CAPTCHA GENERATE
====================== */
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 2,
    color: true
  });

  req.session.captcha = captcha.text;

  res.type("svg");
  res.send(captcha.data);
});

module.exports = router;
