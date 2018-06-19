function redirectKeys(pmore) {
  const keyMap = {
    PageUp: "@P",
    PageDown: "@N",
    End: "@E",
    Home: "@H",
    ArrowLeft: "@l",
    ArrowUp: "@u",
    ArrowRight: "@r",
    ArrowDown: "@d",
    Backspace: "@b",
    Insert: "@I",
    Delete: "@D",
    Enter: "\n"
  };
  
  document.addEventListener("keydown", function(e) {
    // restart
    if (e.key == "p" && e.altKey) {
      pmore.start();
      return;
    }
    
    if (e.altKey || e.ctrlKey) {
      return;
    }
    
    if (e.key.length == 1) {
      pmore.trigger(e.key);
    } else if (keyMap[e.key]) {
      pmore.trigger(keyMap[e.key]);
    } else {
      return;
    }
    
    e.preventDefault();
  });  
}

function createViewer() {
	var statusBar = document.querySelector(".statusbar"),
		lines = document.querySelectorAll(".line"),
		blackout;
    
  const keyNameMap = {
    "@P": "PgUp",
    "@N": "PgDn",
    "@E": "End",
    "@H": "Home",
    "@l": "←",
    "@r": "→",
    "@u": "↑",
    "@d": "↓",
    "@b": "Back",
    "@I": "Ins",
    "@D": "Del"
  };

  function getKeyName(key) {
    // map key back to name for displaying
    return keyNameMap[key] || key;
  }
	
	function drawOptions(options) {
		var i, frag = document.createDocumentFragment();
		for (i = 0; i < options.length; i++) {
			var span = document.createElement("span"),
				key = document.createElement("span"),
				message = document.createElement("span");
				
			span.className = "option";
				
			key.className = "key";
			key.textContent = getKeyName(options[i].key);
			
			message.className = "message";
			message.textContent = options[i].message;
			
			span.appendChild(key);
			span.appendChild(message);
			
			frag.appendChild(span);
		}
		return frag;
	}
	
	function drawSpan(text) {
		var span = document.createElement("span");
		span.className = "option";
		span.textContent = text;
		return span;
	}
	
	return {
		scrollTo: function(frame) {
			if (blackout) {
				blackout.classList.remove("blackout");
				blackout = null;
			}
			lines[frame.line + 1].scrollIntoView();
			if (frame.blackout) {
				frame.blackout.classList.add("blackout");
				blackout = frame.blackout;
			}
		},
		scrollToLine: function(i) {
			lines[i].scrollToView();
		},
		getPageSize: function() {
			return 23;
		},
		pause: function() {
			statusBar.innerHTML = "";
			statusBar.appendChild(drawSpan("動畫暫停，按任意鍵繼續"));
			statusBar.classList.remove("hidden");
		},
		unpause: function() {
			statusBar.classList.add("hidden");
		},
		forceEnd: function() {
			alert("強制中斷動畫！");
		},
		end: function() {
			if (blackout) {
				blackout.classList.remove("blackout");
				blackout = null;
			}
			pmore = null;
		},
		inputStart: function(options) {
			statusBar.innerHTML = "";
			statusBar.appendChild(drawOptions(options));
			statusBar.classList.remove("hidden");
		},
		inputEnd: function() {
			statusBar.classList.add("hidden");
		},
		inputSelect: function(i) {
			var selected = statusBar.querySelector(".selected");
			if (selected) {
				selected.classList.remove("selected");
			}
			statusBar.children[i].classList.add("selected");
		}
	};
}

function createPmore() {
  let frames;
  return {isAnimation, run};
  
  function grabFrames() {
    if (frames) {
      return;
    }
    var lines = document.querySelectorAll(".line"),
      i, result = [];
      
    for (i = 0; i < lines.length; i++) {
      if (/^\^L/.test(lines[i].textContent)) {
        result.push({
          line: i,
          control: lines[i].textContent,
          blackout: null
        });
        lines[i].classList.add("frame");
      }
    }
    
    for (i = 0; i < result.length - 1; i++) {
      result[i].blackout = lines[result[i + 1].line];
    }
    
    frames = result;
  }
  
  function isAnimation() {
    grabFrames();
    return frames.length > 0;
  }
  
  function run() {
    grabFrames();
    const pmore = Pmore(frames, createViewer());
    redirectKeys(pmore);
    pmore.start();
  }
}

function createScrollPosSaver(hashedURL) {
  window.addEventListener("unload", () => {
    sessionStorage[hashedURL + ".scrollPosition"] = JSON.stringify([window.scrollX, window.scrollY]);
  }, {once: true});
  
  try {
    const [x, y] = JSON.parse(sessionStorage[hashedURL + ".scrollPosition"]);
    window.scrollTo(x, y);
  } catch (err) {
    // pass
  }
}

function getBinary(file){
	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.responseType = "arraybuffer";
		xhr.open("GET", file);
		xhr.addEventListener("load", () => resolve(xhr.response));
		xhr.addEventListener("error", () => reject(xhr));
		xhr.send();
	});
}

function createWorker() {
  const worker = new SharedWorker("./content-worker.js");
  worker.port.start();
  return {compileANSI};
  
  function compileANSI(buffer) {
    return new Promise(resolve => {
      worker.port.postMessage(buffer);
      worker.port.addEventListener("message", e => {
        resolve(e.data);
      }, {once: true});
    });
  }
}

function init() {
	document.documentElement.style.background = "black";
  const worker = createWorker();
  const pendingRoot = drawRoot();
  const pendingBuffer = getBinary(location.href);
  const pendingHash = pendingBuffer.then(getHash);
  const pendingANSI = pendingBuffer.then(b => worker.compileANSI(b));
  const pendingURLHash = getHash(new TextEncoder("utf8").encode(location.href));
  const LOOP_TIMEOUT = 2000;
  
  Promise.all([pendingRoot, pendingANSI])
    .then(([, result]) => {
      document.title = result.title;
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
    });
  
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
    getBinary(location.href)
      .then(buffer => 
        getHash(buffer)
          .then(_hash => {
            if (_hash == hash) {
              return;
            }
            hash = _hash;
            return worker.compileANSI(buffer)
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
