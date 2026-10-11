(function () {
  function assetPath(fileName) {
    return `./asset/${fileName}`;
  }

  function formatSigned(value, suffix = "%", digits = 2) {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${Math.abs(value).toFixed(digits).replace(/\.00$/, "")}${suffix}`;
  }

  function nearestKey(table, gp) {
    const keys = Object.keys(table).map(Number);
    return keys.reduce((best, key) => Math.abs(key - gp) < Math.abs(best - gp) ? key : best, keys[0] || 0);
  }

  function createElement(tag, className, attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      if (key === "text") el.textContent = value;
      else if (key === "html") el.innerHTML = value;
      else el.setAttribute(key, value);
    }
    return el;
  }

  window.SPL3 = window.SPL3 || {};
  window.SPL3.utils = { assetPath, formatSigned, nearestKey, createElement };
})();