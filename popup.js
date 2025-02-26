function analyzeHeaders(headers) {
  const keyHeaders = {
    'content-security-policy': 'CSP',
    'strict-transport-security': 'HSTS'
  };
  let missing = [];
  for (let [header, name] of Object.entries(keyHeaders)) {
    if (!headers.find(h => h.name.toLowerCase() === header)) {
      missing.push(name);
    }
  }
  return missing.length > 0 ? missing : null;
}

async function getIPAddress(domain) {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const data = await response.json();
    return data.Answer ? data.Answer[0].data : 'Unknown';
  } catch (error) {
    return 'Error fetching IP';
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
  const tabId = tabs[0].id;
  const url = new URL(tabs[0].url);
  const domain = url.hostname;

  chrome.runtime.sendMessage({ type: 'get_tab_data', tabId }, async response => {
    const data = response.data || {};

    // Phishing Status
    const phishingDiv = document.getElementById('phishing');
    if (data.isPhishing) {
      phishingDiv.innerHTML = `
        <span class="status-not-safe">Not Safe</span> - Phishing Risk
        <div class="warning">Phishing steals your data!</div>
      `;
    } else {
      phishingDiv.innerHTML = `
        <span class="status-safe">Safe</span> - No Phishing Detected
      `;
    }

    // Connection Status
    const connectionDiv = document.getElementById('connection');
    const isHttps = tabs[0].url.startsWith('https:');
    if (isHttps) {
      connectionDiv.innerHTML = `
        <span class="status-safe">Safe</span> - HTTPS Connection
      `;
    } else {
      connectionDiv.innerHTML = `
        <span class="status-not-safe">Not Safe</span> - HTTP Connection
        <div class="warning">HTTPS encrypts your data—HTTP doesn’t!</div>
      `;
    }

    // Headers Status
    const headersDiv = document.getElementById('headers');
    if (data.headers) {
      const missingHeaders = analyzeHeaders(data.headers);
      if (missingHeaders) {
        headersDiv.innerHTML = `
          <span class="status-not-safe">Not Safe</span> - Missing Headers
          <div class="details">Missing: ${missingHeaders.join(', ')}</div>
          <div class="warning">Headers like CSP prevent attacks!</div>
        `;
      } else {
        headersDiv.innerHTML = `
          <span class="status-safe">Safe</span> - All Key Headers Present
          <div class="details">CSP, HSTS detected</div>
        `;
      }
    } else {
      headersDiv.innerHTML = `
        <span class="status-not-safe">Not Safe</span> - Headers Unknown
      `;
    }

    // IP Address Display
    const ipDiv = document.getElementById('ip-address');
    const ip = await getIPAddress(domain);
    ipDiv.innerHTML = `
      <span class="status-safe">IP Address</span> - ${ip}
      <div class="details">Site: ${domain}</div>
    `;
  });
});