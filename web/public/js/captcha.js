document.getElementById("captcha").onclick = function () {
  this.src = "/auth/captcha?" + Date.now();
};
