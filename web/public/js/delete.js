document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".js-confirm-delete").forEach(form => {
    form.addEventListener("submit", (e) => {
      const msg = form.dataset.message || "Are you sure?";

      if (!confirm(msg)) {
        e.preventDefault();
      }
    });
  });
});
