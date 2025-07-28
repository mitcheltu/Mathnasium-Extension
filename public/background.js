chrome.action.onClicked.addListener((tab) => {
  chrome.action.setBadgeText({ text: "ON", tabId: tab.id});
  chrome.action.setBadgeBackgroundColor({ color: "red", tabId: tab.id});
});


let isActive = true;

chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;

  chrome.action.setBadgeText({ text: isActive ? "ON" : "OFF", tabId: tab.id });
  chrome.action.setBadgeBackgroundColor({ color: isActive ? "green" : "gray", tabId: tab.id });

  // Optionally send message to content scripts
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_EXTENSION", active: isActive });
});