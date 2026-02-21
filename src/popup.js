const toggle = document.getElementById("horizontal-toggle");

function sendToActiveTab(enabled) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const [tab] = tabs;
    if (!tab?.id) {
      return;
    }

    chrome.tabs.sendMessage(tab.id, {
      type: "KINDLE_HORIZONTAL_SET",
      enabled
    });
  });
}

chrome.storage.sync.get({ horizontalEnabled: true }, ({ horizontalEnabled }) => {
  toggle.checked = horizontalEnabled;
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ horizontalEnabled: enabled }, () => {
    sendToActiveTab(enabled);
  });
});
