/* eslint-env webextensions */
import {compileANSI} from "./lib/ansi.worker.js";

const VALID_CONTENT_TYPE = new Set([
  "text/plain", "text/ansi", "text/x-ansi"
]);

const ansiViewer = createANSIViewer();

browser.webRequest.onHeadersReceived.addListener(details => {
  if (details.method == "POST") {
    return;
  }
  if (details.statusCode !== 200) {
    return;
  }
  const header = details.responseHeaders.find(h => h.name == "Content-Type");
  if (!header) {
    return;
  }
  const url = new URL(details.url);
  if (/\.(ans|bbs|ansi)$/.test(url.pathname) && VALID_CONTENT_TYPE.has(header.value)) {
    // FIXME: handle file requests
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1341341
    ansiViewer.schedule(details.tabId, details.url);
    return {responseHeaders: details.responseHeaders.filter(h => h !== header)};
  }
}, {
  urls: ["<all_urls>"],
  types: ["main_frame"]
}, ["blocking", "responseHeaders"]);

const METHODS = {
  compileANSI,
  viewAsANSI: () =>
    browser.tabs.executeScript(null, {code: "document.contentType"})
      .then(([type]) => {
        if (VALID_CONTENT_TYPE.has(type)) {
          return ansiViewer.inject();
        }
      })
      .catch(console.error)
};

browser.runtime.onMessage.addListener(message => {
  if (!METHODS[message.method]) {
    return;
  }
  return METHODS[message.method](message.data)
    .catch(err => {
      console.error(err); // eslint-disable-line
      throw err;
    });
});

browser.contextMenus.create({
  title: "View as ANSI",
  onclick(info, tab) {
    ansiViewer.inject(tab.id);
  }
});

browser.commands.onCommand.addListener(command => {
  if (!METHODS[command]) {
    return;
  }
  METHODS[command]();
});

function createANSIViewer() {
  const waitForUpdate = new Set;
  return {schedule, inject};
  
  function inject(tabId = null) {
    const contentScripts = browser.runtime.getManifest().content_scripts;
    for (const file of contentScripts[0].js) {
      browser.tabs.executeScript(tabId, {file});
    }
    for (const file of contentScripts[0].css) {
      browser.tabs.insertCSS(tabId, {file});
    }
  }
  
  // inject when the URL of the tab had been changed to url
  function schedule(tabId, url) {
    if (waitForUpdate.has(tabId)) {
      return;
    }
    browser.tabs.onUpdated.addListener(onUpdated);
    browser.tabs.onRemoved.addListener(onRemoved);
    waitForUpdate.add(tabId);
    
    function uninit() {
      browser.tabs.onUpdated.removeListener(onUpdated);
      browser.tabs.onRemoved.removeListener(onRemoved);
      waitForUpdate.delete(tabId);
    }
    
    function onUpdated(_tabId, changeInfo, tab) {
      if (_tabId !== tabId || tab.url !== url) {
        return;
      }
      inject(tabId);
      uninit();
    }
    
    function onRemoved(_tabId) {
      if (_tabId === tabId) {
        uninit();
      }
    }
  }
}
