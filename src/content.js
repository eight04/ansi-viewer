/* eslint-env webextensions */
import {createPmore} from "./pmore.js";
import {createScrollPosSaver} from "./scroll-pos-saver.js";

function getBinary(file, type = "blob"){
	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.responseType = type;
		xhr.open("GET", file);
		xhr.addEventListener("load", () => resolve(xhr.response));
		xhr.addEventListener("error", () => reject(xhr));
		xhr.send();
	});
}

function compileANSI(data) {
  return browser.runtime.sendMessage({
    method: "compileANSI",
    data
  });
}

function readFile(blob, type) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.addEventListener("load", e => resolve(e.target.result));
    reader.addEventListener("error", reject);
    if (type == "buffer") {
      reader.readAsArrayBuffer(blob);
    } else {
      reader.readAsBinaryString(blob);
    }
  });
}

function init() {
	document.documentElement.style.background = "black";
  const pendingRoot = drawRoot();
  const pendingBinary = getBinary(location.href);
  const pendingHash = pendingBinary.then(b => readFile(b, "buffer")).then(getHash);
  const pendingANSI = pendingBinary.then(b => readFile(b, "binary")).then(compileANSI);
  const pendingURLHash = getHash(new TextEncoder("utf8").encode(location.href));
  const LOOP_TIMEOUT = 2000;
  
  Promise.all([pendingRoot, pendingANSI])
    .then(([, result]) => {
      if (result.title) {
        document.title = result.title;
      }
      document.querySelector(".bbs").innerHTML = result.html;
      document.addEventListener("keydown", e => {
        // invert color
        if (e.key == "l" && e.altKey) {
          document.body.classList.toggle("invert");
          e.preventDefault();
        }
      });
      return pendingURLHash;
    })
    .then(urlHash => {
      createScrollPosSaver(urlHash);
      document.documentElement.style = "";
      const pmore = createPmore();
      if (pmore.isAnimation() && confirm("要執行動畫嗎？")) {
        pmore.run();
      } else if (location.protocol == "file:") {
        return pendingHash.then(hash => {
          setTimeout(drawANSILoop, LOOP_TIMEOUT, hash);
        });
      }
    })
    .catch(console.error); // eslint-disable-line
  
  function drawRoot() {
    if (document.readyState != "loading") {
      doDraw();
      return Promise.resolve();
    }
    return new Promise(resolve => {
      document.addEventListener("DOMContentLoaded", () => {
        doDraw();
        resolve();
      }, {once: true});
    });
    
    function doDraw() {
      document.body.innerHTML = "<div class='bbs'></div><div class='statusbar'></div>";
    }
  }
  
  function drawANSILoop(hash) {
    getBinary(location.href, "arraybuffer")
      .then(buffer =>
        getHash(buffer)
          .then(_hash => {
            if (_hash == hash) {
              return;
            }
            hash = _hash;
            return compileANSI(buffer)
              .then(result => document.querySelector(".bbs").innerHTML = result.html);
          })
      )
      .then(() => setTimeout(drawANSILoop, LOOP_TIMEOUT, hash));
  }
  
  function getHash(buffer) {
    return crypto.subtle.digest("SHA-256", buffer)
      .then(hash => {
        return new TextDecoder("latin1").decode(hash);
      });
  }
}

if (
  document.contentType == "text/plain" ||
  document.contentType == "text/x-ansi"
) {
  init();
}
