// Email links: try to open the visitor's mail app, and always copy the address and show it,
// so the link works even when no mail app is set up.
(function () {
  if (new URLSearchParams(location.search).has("edit")) return;
  var EMAIL = "apalacios@stanford.edu";
  var toast;
  function show(msg) {
    if (!toast) {
      toast = document.createElement("div");
      toast.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#161616;border:1px solid #3CC6C0;color:#f1ede6;padding:12px 20px;border-radius:999px;font:500 15px/1.4 Manrope,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6);transition:opacity .3s;max-width:92vw;text-align:center";
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg; toast.style.opacity = "1";
    clearTimeout(toast._t); toast._t = setTimeout(function () { toast.style.opacity = "0"; }, 4000);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    var done = function () { show('Email copied: <b style="color:#ED6F4A">' + EMAIL + '</b>'); };
    if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(done, function () { show('Email me at <b style="color:#ED6F4A">' + EMAIL + '</b>'); });
    else show('Email me at <b style="color:#ED6F4A">' + EMAIL + '</b>');
  });
})();
