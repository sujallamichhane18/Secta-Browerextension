let phishingList = new Set(['http://fake-phishing.com', 'http://scam-site.org']);
let phishingBloom = {
  test: url => phishingList.has(url)
};
const tabData = {};
chrome.webRequest.onHeadersReceived.addListener(
  details => {
    tabData[details.tabId] = { headers: details.responseHeaders };
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'check_phishing') {
    const isPhishing = phishingBloom.test(msg.url);
    tabData[sender.tab.id] = { ...tabData[sender.tab.id], isPhishing };
    sendResponse({ isPhishing });
  } else if (msg.type === 'get_tab_data') {
    sendResponse({ data: tabData[msg.tabId] });
  }
});