function toggle(id) {
  const el = document.getElementById(id);
  el.style.display = (el.style.display === "none") ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnTitle")?.addEventListener("click", () => {
    toggle("titleForm");
  });

  document.getElementById("btnMenu")?.addEventListener("click", () => {
    toggle("menuForm");
  });

  document.getElementById("btnSeo")?.addEventListener("click", () => {
    toggle("seoForm");
  });

  document.getElementById("btnPassword").onclick = () => {
    const el = document.getElementById("passwordForm");
    el.style.display = el.style.display === "none" ? "block" : "none";
  };

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (!confirm(btn.dataset.confirm)) {
        e.preventDefault();
      }
    });
  });

});
