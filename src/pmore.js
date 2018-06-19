import Pmore from "pmore";

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

export function createPmore() {
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
