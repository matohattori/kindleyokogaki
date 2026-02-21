const STYLE_ID = "kindle-horizontal-style";
const FORCE_CLASS = "khr-force-horizontal";
const DEBUG_PREFIX = "[kindle-horizontal]";
let observer = null;
let applyTimer = null;
let retryTimer = null;
let retryCount = 0;

const TARGET_SELECTORS = [
  ".kg-full-page-text-layer",
  ".kg-text-layer",
  ".kg-content",
  "[data-testid*='content']",
  "[class*='content']",
  "[class*='Content']",
  "[class*='textLayer']",
  "[class*='TextLayer']",
  "[class*='bookText']",
  "[class*='BookText']",
  "[role='document']",
  "[data-testid*='text']",
  "[data-aid*='text']"
].join(",\n    ");
const APPLY_RETRY_MS = 1200;
const MAX_RETRY_COUNT = 12;

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
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  getCandidateRoots().forEach((root) => {
    if (root.nodeType === Node.ELEMENT_NODE && root.classList?.contains(FORCE_CLASS)) {
      root.classList.remove(FORCE_CLASS);
    }

    root.querySelectorAll(`.${FORCE_CLASS}`).forEach((element) => {
      element.classList.remove(FORCE_CLASS);
    });
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

  const discovered = [...new Set(roots.filter(Boolean))];

  discovered.forEach((root) => {
    collectShadowRoots(root).forEach((shadowRoot) => discovered.push(shadowRoot));
  });

  document.querySelectorAll("iframe").forEach((frame) => {
    const frameDocument = frame.contentDocument;
    if (frameDocument?.body) {
      discovered.push(frameDocument.body);
    }
  });

  return [...new Set(discovered)];
}

function collectShadowRoots(root) {
  const queue = [root];
  const shadowRoots = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current?.querySelectorAll) {
      continue;
    }

    current.querySelectorAll("*").forEach((element) => {
      if (!element.shadowRoot) {
        return;
      }

      shadowRoots.push(element.shadowRoot);
      queue.push(element.shadowRoot);
    });
  }

  return shadowRoots;
}

function collectCandidateElements() {
  const seen = new Set();
  const candidates = [];

  getCandidateRoots().forEach((root) => {
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.(TARGET_SELECTORS) && !seen.has(root)) {
      seen.add(root);
      candidates.push(root);
    }

    root.querySelectorAll?.(TARGET_SELECTORS).forEach((node) => {
      if (seen.has(node)) {
        return;
      }

      seen.add(node);
      candidates.push(node);
    });
  });

  if (candidates.length > 0) {
    return candidates;
  }

  const fallbackSelectors = [
    "article",
    "section",
    "p",
    "[class*='reader']",
    "[class*='Reader']"
  ].join(", ");

  getCandidateRoots().forEach((root) => {
    root.querySelectorAll?.(fallbackSelectors).forEach((node) => {
      if (seen.has(node) || node.textContent?.trim().length < 40) {
        return;
      }

      seen.add(node);
      candidates.push(node);
    });
  });

  return candidates;
}

function applyHorizontalToDetectedElements() {
  if (!document.getElementById(STYLE_ID)) {
    return;
  }

  clearForcedClasses();
  const candidates = collectCandidateElements();

  let matchCount = 0;
  candidates.forEach((element) => {
    const className = typeof element.className === "string" ? element.className.toLowerCase() : "";

    if (!hasVerticalWritingMode(element) && !className.includes("text")) {
      return;
    }

    element.classList.add(FORCE_CLASS);
    matchCount += 1;
  });

  if (matchCount === 0) {
    retryCount += 1;

    if (retryCount > MAX_RETRY_COUNT) {
      console.debug(`${DEBUG_PREFIX} No target text nodes were detected after retries.`);
      return;
    }

    console.debug(`${DEBUG_PREFIX} No target text nodes detected yet (retry ${retryCount}/${MAX_RETRY_COUNT}).`);

    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      if (document.getElementById(STYLE_ID)) {
        applyHorizontalToDetectedElements();
      }
    }, APPLY_RETRY_MS);
    return;
  }

  retryCount = 0;
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

  const observeTarget = (target) => {
    observer.observe(target, {
      childList: true,
      subtree: true
    });
  };

  observeTarget(document.documentElement);
  getCandidateRoots().forEach((root) => {
    if (root instanceof ShadowRoot) {
      observeTarget(root);
    }
  });
}

function stopObserver() {
  observer?.disconnect();
  observer = null;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  retryCount = 0;
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
