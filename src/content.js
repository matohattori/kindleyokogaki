const STYLE_ID = "kindle-horizontal-style";

function ensureHorizontalStyle(enabled) {
  const existing = document.getElementById(STYLE_ID);

  if (!enabled) {
    existing?.remove();
    return;
  }

  if (existing) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --khr-inline-size: min(72ch, 90vw);
    }

    [style*="vertical-rl"],
    [style*="vertical-lr"],
    [style*="writing-mode"] {
      writing-mode: horizontal-tb !important;
      text-orientation: mixed !important;
      direction: ltr !important;
    }

    .kg-full-page-text-layer,
    .kg-text-layer,
    [class*="textLayer"],
    [class*="TextLayer"],
    [role="document"] {
      writing-mode: horizontal-tb !important;
      text-orientation: mixed !important;
      line-height: 1.8 !important;
      max-inline-size: var(--khr-inline-size) !important;
      margin-inline: auto !important;
      white-space: normal !important;
    }
  `;

  document.documentElement.appendChild(style);
}

function loadInitialSetting() {
  chrome.storage.sync.get({ horizontalEnabled: true }, ({ horizontalEnabled }) => {
    ensureHorizontalStyle(horizontalEnabled);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "KINDLE_HORIZONTAL_SET") {
    return;
  }

  ensureHorizontalStyle(Boolean(message.enabled));
  sendResponse({ ok: true });
});

loadInitialSetting();
