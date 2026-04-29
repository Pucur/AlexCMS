# AlexCMS 🚀

A lightweight, multilingual, self-hosted CMS built with **Node.js**, **Express**, and **PostgreSQL**.
Designed for simplicity, speed, and easy deployment with Docker.

![Screenshot](screenshot.avif)

AlexCMS provides a clean admin interface for managing:

* 📄 Articles
* 📂 Downloads
* 🖼️ Galleries
* 📝 Guestbook messages
* 🌍 Automatic translations
* 🔐 Secure admin authentication
* 📊 Visitor statistics
* 🧾 SEO settings

---

# ✨ Features

## 🌍 Multilingual Content

* Hungarian + English support out of the box
* Automatic translation using Google Translate API
* Language switching via session handling

## 📄 Article System

* Rich HTML content support
* Sanitized HTML for security
* Image embedding support
* Full CRUD operations for articles

## 📂 Download Manager

* File upload support
* Download counter
* Automatic file size detection
* Local file hosting or external links

## 🖼️ Gallery System

* Image uploads
* Gallery categories via menus
* Automatic multilingual titles

## 📝 Guestbook

* Public guestbook system
* Admin moderation & deletion

## 🔐 Authentication & Security

* bcrypt password hashing
* SVG CAPTCHA login protection
* Session-based authentication
* Content Security Policy (CSP)
* HTML sanitization
* Login attempt limiting

## 📊 Visitor Statistics

* Unique daily visit tracking
* Total visitor count
* Daily averages
* Cached statistics system for better performance

## 🧾 SEO Ready

* Dynamic meta description
* Meta keywords
* robots.txt support
* Configurable site title

## 📦 Logging System

* Winston logger
* Daily rotating logs
* Separate error logs
* Automatic compression
* Console logging support

## 🐳 Docker Ready

* PostgreSQL container
* Caddy reverse proxy
* HTTPS support
* Persistent volumes

---

# 🛠️ Tech Stack

| Technology | Purpose               |
| ---------- | --------------------- |
| Node.js    | Backend runtime       |
| Express.js | Web framework         |
| PostgreSQL | Database              |
| Quill      | Text editor           |
| EJS        | Templating            |
| Docker     | Containerization      |
| Caddy      | Reverse proxy & HTTPS |
| Winston    | Logging               |
| Multer     | File uploads          |
| bcrypt     | Password hashing      |
| svg-captcha | Login captcha        |
| sanitize-html        | XSS protection     |
| google-translate-api | Translation system |
| http-proxy-agent     | Proxy support      |
---

# 📁 Project Structure

```bash
AlexCMS/
├── .env                      # Credentials, please delete this file later.
├── .session                  # User session key for middleware
├── docker-compose.yml        # Multi-container setup (app + db + caddy)
├── Dockerfile                # Node.js container build
├── Caddyfile                 # Reverse proxy + HTTPS config
├── package.json              # Dependencies & scripts
│
├── data/                     # Persistent user content
│   ├── uploads/              # Uploaded files (downloads)
│   └── pictures/             # Uploaded images (gallery/articles)
│
├── logs/                     # Application logs (Winston rotation)
│
├── web/                      # Main application source
│
│   ├── routes/               # Backend routing layer (Express)
│   │   ├── admin.js          # Admin panel (CMS core)
│   │   ├── auth.js           # Authentication & login system
│   │   ├── guestbook.js      # Guestbook functionality
│   │   └── main.js           # Public-facing routes
│
│   ├── views/                # EJS template engine views
│   │   ├── admin.ejs
│   │   ├── article.ejs
│   │   ├── downloads.ejs
│   │   ├── gallery.ejs
│   │   ├── guestbook.ejs
│   │   ├── index.ejs
│   │   ├── layout.ejs
│   │   ├── login.ejs
│   │   ├── menu_edit.ejs
│   │   └── privacy.ejs
│
│   ├── public/               # Static frontend assets
│   │   ├── js/               # Client-side scripts
│   │   │  ├── admin.js
│   │   │  ├── captcha.js
│   │   │  ├── delete.js
│   │   │  ├── gallery.js
│   │   │  └── menu_edit.js
│   │   │
│   │   ├── favicon.png
│   │   ├── robots.txt
│   │   └── style.css
│
│   ├── db.js                 # PostgreSQL connection layer
│   ├── logger.js             # Winston logging configuration
│   └── server.js             # Application entry point
```

---

# 🚀 Installation

# 🐳 Option 1 — Docker Deployment (Local / VPS / Simple Setup)

The simplest way to run AlexCMS is using Docker Compose.

## ⚙️ Requirements

* Docker
* Docker Compose

## 1. Clone Repository

```bash
git clone https://github.com/yourname/alexcms.git
cd alexcms
```

---

## 2. Create Environment File

Create a `.session` file:

```env
SESSION_SECRET=super_secret_key
```
Create a `.env` file:

```env
DB_PASSWORD=your_db_password
ADMIN_USER=Admin_name
ADMIN_PASSWORD=strong_password
```

## 3. (Optional) Caddy HTTPS

Create a `Caddyfile` file if you wish HTTPS redirect:

```
example.com {
   reverse_proxy app:80
}
```

---

## 4. Start Containers

```bash
docker compose up -d
```

---

## 🌐 Access

After startup:

```
http://localhost
```

or your server IP:

```
http://YOUR_SERVER_IP
```

---

## 📁 What it starts

* Node.js CMS (`app`)
* PostgreSQL database (`db`)
* Caddy reverse proxy (optional HTTPS support)

---

## 💡 Notes

* Database is automatically initialized
* Admin user is created on first run
* All uploads are persisted in `/data`
* Logs are stored in `/logs`

---

# ☁️ Option 2 — Full Automated Cloud Deployment (OCI + GitHub Actions)

This version uses **CI/CD automation** and provisions a full server on Oracle Cloud Infrastructure (OCI).

It includes:

* Terraform infrastructure provisioning
* Automatic server setup
* Docker installation
* GitHub Actions deployment pipeline
* Auto Caddy HTTPS reverse proxy
* First-run bootstrapping system

---

## ⚙️ Requirements

You must configure these GitHub Secrets:

| Secret name          | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `ADMIN_USER`         | Username of the website administrator                       |
| `COMPARTMENT`        | OCI Compartment ID                                          |
| `CREDENTIAL`         | OCI API credential name                                     |
| `DOMAIN`             | Your domain name                                            |
| `FINGERPRINT`        | OCI API key fingerprint                                     |
| `KEY_FILE`           | OCI private API key content                                 |
| `REPO_VARIABLES_PAT` | GitHub Personal Access Token (for repository variables API) |
| `SSH_PRIVATE_KEY`    | SSH private key for server access                           |
| `SUBNET`             | OCI subnet ID                                               |
| `TENANCY`            | OCI tenancy OCID                                            |
| `USER`               | OCI user OCID                                               |

and also those Github variables:


| Variable name   | Description                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `INSTALLED`     | Indicates whether the instance has already been initialized (`true` / `false`)                                      |
| `INSTANCE_NAME` | Name of your OCI virtual machine                                                                                    |
| `PUBLIC_SSH`    | Your public SSH key used for instance access                                                                        |
| `REGION`        | OCI region where the resources will be deployed                                                                     |
| `SERVER_IP`     | The public IP address of your server (set automatically after deployment)                                           |
| `SOURCE`        | OCI image source ID (see: [https://docs.oracle.com/en-us/iaas/images/](https://docs.oracle.com/en-us/iaas/images/)) |


---

## 🚀 Deployment Flow

Once you push to `main` branch:

### 1. Infrastructure provisioning

* OCI instance created via Terraform
* Public IP automatically fetched

### 2. Server bootstrap

* Docker installed automatically
* System dependencies installed
* MOTD cleaned + Fastfetch enabled (because why not 😅)
* Git configured

### 3. Application deployment

* Repository cloned via GitHub token
* `.env` generated automatically
* `.session` secret created
* Caddy reverse proxy configured

### 4. Auto start

```bash id="deploy1"
docker compose up -d --build
```

---

## 🌐 Result

Your site becomes available at:

```
http://SERVER_IP
```

or (if DOMAIN is configured):

```
https://your-domain.com
```

---

## 🔁 Automatic Updates

Every push to `main`:

* Pulls latest code
* Rebuilds Docker containers
* Restarts services
* Cleans unused images

---

## 🧠 First-time setup behavior

On first deployment:

* System packages are installed
* Docker is configured
* Secure passwords are generated automatically
* GitHub variable `INSTALLED=true` is set
* Server becomes fully production-ready

---

## 🔐 Security highlights

* SSH key-based login only
* No hardcoded secrets
* Randomized admin + DB passwords
* Secure session generation
* Firewall-ready architecture (OCI default rules)

---

# 🆚 Comparison

| Feature        | Docker    | OCI Auto Deploy   |
| -------------- | --------- | ----------------- |
| Setup speed    | ⚡ Fast    | ⏳ Medium          |
| Infrastructure | Local/VPS | Cloud (OCI)       |
| CI/CD          | ❌ Manual  | ✅ Fully automated |
| HTTPS          | Optional  | Auto (Caddy)      |
| Scaling        | Manual    | Cloud-ready       |

---

# 💡 Recommendation

* Use **Docker** for local development
* Use **OCI deployment** for production

---

# ⚙️ Automatic Initialization

On first startup AlexCMS automatically:

* Creates all database tables
* Seeds default menu entries
* Creates admin credentials
* Initializes settings
* Creates upload directories

---

# 📊 Database Tables

| Table     | Purpose            |
| --------- | ------------------ |
| menu      | Dynamic navigation |
| articles  | Article storage    |
| downloads | Downloadable files |
| gallery   | Image galleries    |
| guestbook | Visitor messages   |
| settings  | Site configuration |
| visits    | Visitor statistics |

---

# 🐳 Docker Services

| Service | Description           |
| ------- | --------------------- |
| app     | Node.js CMS           |
| db      | PostgreSQL database   |
| caddy   | Reverse proxy + HTTPS |

---

# 🔄 Changelog
- Version 1.0

  I think I fixed all the bugs 🤞

# 📄 License

MIT License

---

# ❤️ Author

Built by **Alex** — use it as you wish.

If you like the project, feel free to ⭐ the repository.
