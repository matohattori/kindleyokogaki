const STYLE_ID = "kindle-horizontal-style";
const FORCE_CLASS = "khr-force-horizontal";
let observer = null;
let applyTimer = null;

const TARGET_SELECTORS = [
  ".kg-full-page-text-layer",
  ".kg-text-layer",
  "[class*='textLayer']",
  "[class*='TextLayer']",
  "[role='document']",
  "[data-testid*='text']",
  "[data-aid*='text']"
].join(",\n    ");

function ensureHorizontalStyle(enabled) {
  const existing = document.getElementById(STYLE_ID);

  if (!enabled) {
    existing?.remove();
    clearForcedClasses();
    stopObserver();
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

    ${TARGET_SELECTORS} {
      writing-mode: horizontal-tb !important;
      text-orientation: mixed !important;
      line-height: 1.8 !important;
      max-inline-size: var(--khr-inline-size) !important;
      margin-inline: auto !important;
      white-space: normal !important;
    }

    .${FORCE_CLASS} {
      writing-mode: horizontal-tb !important;
      text-orientation: mixed !important;
      direction: ltr !important;
    }
  `;

  document.documentElement.appendChild(style);
  applyHorizontalToDetectedElements();
  startObserver();
}

function clearForcedClasses() {
  document.querySelectorAll(`.${FORCE_CLASS}`).forEach((element) => {
    element.classList.remove(FORCE_CLASS);
  });
}

function hasVerticalWritingMode(element) {
  const writingMode = getComputedStyle(element).writingMode || "";
  return writingMode.includes("vertical");
}

function getCandidateRoots() {
  const roots = [document.body];
  const extraRoots = document.querySelectorAll([
    "main",
    "[role='main']",
    "[role='document']",
    "[class*='reader']",
    "[class*='Reader']",
    "[class*='page']",
    "[class*='Page']"
  ].join(", "));

  extraRoots.forEach((node) => roots.push(node));
  return [...new Set(roots.filter(Boolean))];
}

function applyHorizontalToDetectedElements() {
  if (!document.getElementById(STYLE_ID)) {
    return;
  }

  clearForcedClasses();

  const seen = new Set();
  const candidates = [];

  getCandidateRoots().forEach((root) => {
    if (!seen.has(root)) {
      seen.add(root);
      candidates.push(root);
    }

    root.querySelectorAll("*").forEach((node) => {
      if (seen.has(node)) {
        return;
      }

      seen.add(node);
      candidates.push(node);
    });
  });

  let matchCount = 0;
  candidates.forEach((element) => {
    if (!hasVerticalWritingMode(element)) {
      return;
    }

    element.classList.add(FORCE_CLASS);
    matchCount += 1;
  });

  if (matchCount === 0) {
    console.debug("[kindle-horizontal] No vertical writing-mode elements detected.");
  }
}

function scheduleApplyHorizontal() {
  if (applyTimer) {
    clearTimeout(applyTimer);
  }

  applyTimer = setTimeout(() => {
    applyTimer = null;
    applyHorizontalToDetectedElements();
  }, 150);
}

function startObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    const style = document.getElementById(STYLE_ID);
    if (!style) {
      return;
    }

    if (!document.documentElement.contains(style)) {
      document.documentElement.appendChild(style);
    }

    scheduleApplyHorizontal();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function stopObserver() {
  observer?.disconnect();
  observer = null;
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
