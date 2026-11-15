// Site text editor. Open the site with ?edit at the end of the address to use it.
// Without ?edit this file does nothing.
(function () {
  if (!new URLSearchParams(location.search).has("edit")) return;

  var REPO = "anapalaciosrm/anapalaciosrm.github.io";
  var FILE = "index.html";
  var TOKEN_KEY = "site-editor-token";
  var SELECTOR = "h1, h2, h3, h4, p, li, dt, dd, blockquote, figcaption, .cap b, .cap i";

  document.addEventListener("DOMContentLoaded", start);
  if (document.readyState !== "loading") start();

  function start() {
    if (document.getElementById("edit-bar")) return;
    document.querySelectorAll(SELECTOR).forEach(function (el) {
      if (el.closest("#edit-bar")) return;
      el.setAttribute("contenteditable", "true");
    });
    // Clicking a link while editing should not leave the page.
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (a && !a.closest("#edit-bar")) e.preventDefault();
    }, true);

    var style = document.createElement("style");
    style.id = "edit-style";
    style.textContent =
      "[contenteditable]{outline:1px dashed rgba(60,198,192,.35);outline-offset:3px;border-radius:2px}" +
      "[contenteditable]:hover{outline-color:rgba(60,198,192,.8)}" +
      "[contenteditable]:focus{outline:2px solid #ED6F4A;background:rgba(237,111,74,.06)}" +
      "#edit-bar{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9999;display:flex;gap:10px;align-items:center;" +
      "background:#161616;border:1px solid #333;border-radius:999px;padding:10px 12px 10px 20px;font:600 14px/1 'Narrow',sans-serif;letter-spacing:.06em;color:#efebe4;box-shadow:0 10px 40px rgba(0,0,0,.6)}" +
      "#edit-bar button{font:inherit;letter-spacing:inherit;border:0;border-radius:999px;padding:10px 16px;cursor:pointer}" +
      "#edit-bar .save{background:#ED6F4A;color:#0a0a0a}#edit-bar .dl{background:#2a2a2a;color:#efebe4}#edit-bar .exit{background:transparent;color:#9a968f}" +
      "#edit-msg{color:#3CC6C0;min-width:120px}";
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.id = "edit-bar";
    bar.innerHTML =
      '<span>EDITING</span><span id="edit-msg">Click any text to change it</span>' +
      '<button class="save">Save and publish</button>' +
      '<button class="dl">Download</button>' +
      '<button class="exit">Exit</button>';
    document.body.appendChild(bar);
    bar.querySelector(".save").onclick = save;
    bar.querySelector(".dl").onclick = download;
    bar.querySelector(".exit").onclick = function () {
      if (confirm("Leave without saving? Unsaved changes will be lost.")) location.href = location.pathname;
    };
    window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    document.addEventListener("input", function () { dirty = true; msg("Unsaved changes"); });
  }

  var dirty = false;
  function msg(t) { var m = document.getElementById("edit-msg"); if (m) m.textContent = t; }

  // Builds a clean copy of the page with all editor bits removed.
  function cleanHTML() {
    var root = document.documentElement.cloneNode(true);
    root.querySelectorAll("#edit-bar, #edit-style").forEach(function (n) { n.remove(); });
    root.querySelectorAll("[contenteditable]").forEach(function (n) { n.removeAttribute("contenteditable"); });
    return "<!DOCTYPE html>\n" + root.outerHTML + "\n";
  }

  function download() {
    var blob = new Blob([cleanHTML()], { type: "text/html" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    a.click();
    msg("Downloaded index.html");
  }

  function toBase64(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async function save() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = prompt("Paste your GitHub token (only needed once on this browser):");
      if (!token) return;
      token = token.trim();
      localStorage.setItem(TOKEN_KEY, token);
    }
    var headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
    var url = "https://api.github.com/repos/" + REPO + "/contents/" + FILE;
    try {
      msg("Saving...");
      var cur = await fetch(url + "?ref=main", { headers: headers });
      if (cur.status === 401 || cur.status === 403) throw new Error("token");
      var sha = (await cur.json()).sha;
      var res = await fetch(url, {
        method: "PUT", headers: headers,
        body: JSON.stringify({ message: "Edit text with the site editor", content: toBase64(cleanHTML()), sha: sha, branch: "main" })
      });
      if (res.status === 401 || res.status === 403) throw new Error("token");
      if (!res.ok) throw new Error("GitHub said " + res.status);
      dirty = false;
      msg("Published. Live in about a minute.");
    } catch (err) {
      if (err.message === "token") {
        localStorage.removeItem(TOKEN_KEY);
        msg("Token not accepted. Click save to try again.");
      } else {
        msg("Could not save: " + err.message + ". Try Download.");
      }
    }
  }
})();
