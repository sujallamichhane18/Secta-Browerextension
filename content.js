if (location.protocol !== 'https:') {
  chrome.runtime.sendMessage({ type: 'insecure', url: location.href });
}
chrome.runtime.sendMessage(
  { type: 'check_phishing', url: location.href },
  response => {
    if (response.isPhishing) console.log('Phishing detected!');
  }
);