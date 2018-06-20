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
      // this doesn't work
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1341341
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
      header.value = "text/plain";
    } else {
      details.responseHeaders.push({name: "Content-Type", value: "text/plain"});
    }
    return {responseHeaders: details.responseHeaders};
  }
}, {
  urls: ["<all_urls>"],
  types: ["main_frame"]
}, ["blocking", "responseHeaders"]);

const ansiWorker = createANSIWorker();

browser.runtime.onMessage.addListener(message => {
  if (message.name === "COMPILE_ANSI") {
    return ansiWorker.compileANSI(message.data);
  }
});

function createANSIWorker() {
  let worker;
  let error;
  let nextId = 0;
  const waitForResponse = new Map;
  return {compileANSI};
  
  function init() {
    worker = new Worker("/js/ansi-worker.js");
    worker.addEventListener("error", onError);
    worker.addEventListener("message", onMessage);
  }
  
  function compileANSI(data) {
    if (!worker) {
      init();
    }
    return new Promise((resolve, reject) => {
      if (error) {
        reject(error);
        return;
      }
      const requestId = nextId++;
      worker.postMessage({requestId, data});
      waitForResponse.set(requestId, {resolve, reject});
    });
  }
  
  function onError(err) {
    error = err;
  }
  
  function onMessage(e) {
    if (e.data.error) {
      waitForResponse.get(e.data.requestId).reject(e.data.data);
    } else {
      waitForResponse.get(e.data.requestId).resolve(e.data.data);
    }
    waitForResponse.delete(e.data.requestId);
  }
}

const waitForUpdate = new Set;
function viewAsANSI(tabId, url) {
  init();
  
  function init() {
    if (waitForUpdate.has(tabId)) {
      return;
    }
    browser.tabs.onUpdated.addListener(onUpdated);
    browser.tabs.onRemoved.addListener(onRemoved);
    waitForUpdate.add(tabId);
  }
  
  function uninit() {
    browser.tabs.onUpdated.removeListener(onUpdated);
    browser.tabs.onRemoved.removeListener(onRemoved);
    waitForUpdate.delete(tabId);
  }
  
  function onUpdated(_tabId, changeInfo, tab) {
    if (_tabId !== tabId || tab.url !== url) {
      return;
    }
    browser.tabs.executeScript(tabId, {
      file: "/js/browser-polyfill.min.js"
    });
    browser.tabs.executeScript(tabId, {
      file: "/js/content.js"
    });
    browser.tabs.insertCSS(tabId, {
      file: "/css/bbs-reader.css"
    });
    browser.tabs.insertCSS(tabId, {
      file: "/css/viewer.css"
    });
    uninit();
  }
  
  function onRemoved(_tabId) {
    if (_tabId === tabId) {
      uninit();
    }
  }
}
