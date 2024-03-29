/* eslint-env webextensions */
import {createPmore} from "./lib/pmore.js";
import {createScrollPosSaver} from "./lib/scroll-pos-saver.js";
import {getBinary} from "./lib/get-binary.js";

import "./content.css";

let xhrErr = null;
async function getBinaryX(url) {
  if (!xhrErr) {
    try {
      return await getBinary(url);
    } catch (err) {
      console.error(err);
      xhrErr = err;
    }
  }
  return browser.runtime.sendMessage({
    method: "getBinary",
    data: url
  });
}

function compileANSI(data) {
  return browser.runtime.sendMessage({
    method: "compileANSI",
    data
  });
}

function createANSIViewer() {
  document.documentElement.style.background = "black";
  const pendingRoot = drawRoot();
  const pendingBinary = getBinaryX(location.href);
  const pendingANSI = pendingBinary.then(compileANSI);
  const LOOP_TIMEOUT = 2000;
  
  return Promise.all([pendingRoot, pendingANSI])
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
      createScrollPosSaver(location.href);
      document.documentElement.style = "";
      const pmore = createPmore();
      if (pmore.isAnimation() && confirm("要執行動畫嗎？")) {
        pmore.run();
      } else if (location.protocol == "file:") {
        return pendingBinary.then(binary => {
          setTimeout(drawANSILoop, LOOP_TIMEOUT, binary);
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
  
  function drawANSILoop(binary) {
    getBinaryX(location.href)
      .then(newBinary => {
        if (newBinary == binary) {
          return;
        }
        binary = newBinary;
        return compileANSI(binary)
          .then(result => document.querySelector(".bbs").innerHTML = result.html);
      })
      .then(() => setTimeout(drawANSILoop, LOOP_TIMEOUT, binary));
  }
}

if (!window.ansiViewer) {
  window.ansiViewer = createANSIViewer();
}
