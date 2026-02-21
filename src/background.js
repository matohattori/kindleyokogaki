chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("horizontalEnabled", (result) => {
    if (typeof result.horizontalEnabled !== "boolean") {
      chrome.storage.sync.set({ horizontalEnabled: true });
    }
  });
});
