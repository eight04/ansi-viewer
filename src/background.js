import browser from "webextension-polyfill";

browser.webRequest.onHeadersReceived.addListener(details => {
  if (details.method == "POST") {
    return;
  }
  if (details.statusCode !== 200) {
    return;
  }
  const url = new URL(details.url);
  let header = details.responseHeaders.find(h => h.name == "Content-Type");
  if (
    /\.(ans|bbs|ansi)$/.test(url.pathname) && 
    (
      url.protocol == "file:" ||
      !header ||
      header.value == "text/plain" ||
      header.value == "text/x-ansi" ||
      header.value == "application/octet-stream"
    )
  ) {
    if (url.protocol !== "file:") {
      viewAsANSI(details.tabId, details.url);
    }
    if (header) {
      header.value = "text/x-ansi";
    } else {
      details.responseHeaders.push({name: "Content-Type", value: "text/x-ansi"});
    }
    return {responseHeaders: details.responseHeaders};
  }
}, {types: ["main_frame"]}, ["blocking", "responseHeaders"]);

function viewAsANSI(tabId, url) {
  browser.tabs.get(tabId)
    .then(tab => {
      console.log(tab, url);
    });
}
