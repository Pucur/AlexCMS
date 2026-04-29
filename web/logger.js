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
const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const logDir = path.join(__dirname, "/app/logs");

const transport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: "%DATE%-app.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  zippedArchive: true
});

const errorTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: "%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
  zippedArchive: true
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, ip, message, method, url, role }) => {
      return `${timestamp} [${level}] - ${ip} ${method} ${url} (${role}) ${message}`;
    })
  ),
  transports: [
    transport,
    errorTransport,
    new winston.transports.Console()
  ]
});

module.exports = logger;
