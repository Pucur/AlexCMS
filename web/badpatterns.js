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


/* =========================
   CLOUD / CREDENTIAL FILE SCANS
========================= */
 /service-account\.json/i,
 /aws\.json/i,
 /gcp\.json/i,
 /private\.json/i,
 /cloud\.json/i,
 /terraform\.tfstate/i,
 /terraform\.tfvars/i,
 /\.tfvars/i,

/* =========================
   CONTAINER / DEVOPS CONFIGS
========================= */
 /docker-compose/i,
 /docker\/compose/i,
 /compose\.ya?ml/i,
 /k8s/i,
 /kubernetes/i,
 /helm\/values/i,
 /values(-production)?\.ya?ml/i,
 /Dockerfile/i,
 /nginx\.conf/i,
 /Jenkinsfile/i,
 /bitbucket-pipelines\.yml/i,
 /azure-pipelines\.yml/i,
 /\.drone\.ya?ml/i,
 /\.buildkite/i,

/* =========================
   JAVA / SPRING / APP CONFIG LEAKS
========================= */
 /application\.(ya?ml|properties|json)/i,
 /parameters\.ya?ml/i,
 /app\.ya?ml/i,
 /config\.ya?ml/i,
 /spring/i,
 /actuator/i,  // már nálad is van, de ide is passzol

/* =========================
   LOG / DUMP / MEMORY EXPOSURE
========================= */
 /heapdump/i,
 /threaddump/i,
 /dump/i,
 /trace/i,
 /server\.log/i,
 /application\.log/i,
 /access\.log/i,
 /error\.log/i,
 /logs\//i,
 /logfile/i,

/* =========================
   IDE / SOURCE CONTROL LEAKS
========================= */
 /\.idea\//i,
 /\.vscode\//i,
 /\.git\//i,
 /\.env/i,
 /\.npmrc/i,
 /\.netrc/i,
 /\.pypirc/i,

/* =========================
   SSH / PRIVATE KEYS (CRITICAL)
========================= */
 /\.ssh\//i,
 /id_rsa/i,
 /server\.pem/i,

/* =========================
   INTERNAL / WEB-INF EXPOSURE
========================= */
 /WEB-INF/i,
 /META-INF/i,
 /context\.xml/i,
 /web\.xml/i,

/* =========================
   EMAIL / THIRD PARTY KEYS (e.g. SendGrid)
========================= */
 /sendgrid/i,
 /mailer/i,
 /email/i,
 /smtp/i,

/* =========================
   GENERIC INFRA STRUCTURE ENUMERATION
========================= */
 /infra/i,
 /infrastructure/i,
 /backend/i,
 /deploy/i,
 /services/i,
 /src\//i,
 /app\//i,
 /api\//i,

 ];

module.exports = badPatterns;
