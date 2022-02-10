/* eslint-env webextensions */
import {createPmore} from "./lib/pmore.js";
import {createScrollPosSaver} from "./lib/scroll-pos-saver.js";

import "./content.css";

function getBinary(file, type = "blob"){
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open("GET", file);
    xhr.addEventListener("load", () =>
      readBinaryString(xhr.response).then(resolve, reject)
    );
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

function readBinaryString(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.addEventListener("load", e => resolve(e.target.result));
    reader.addEventListener("error", reject);
    reader.readAsBinaryString(blob);
  });
}

function createANSIViewer() {
  document.documentElement.style.background = "black";
  const pendingRoot = drawRoot();
  const pendingBinary = getBinary(location.href);
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
    getBinary(location.href)
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
