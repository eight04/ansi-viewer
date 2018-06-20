function cmd(cmd) {
	var match = cmd.match(/:([^:]+):|([fpl])(([+-]?)\d+)/),
		typeTable = {
			f: "frame",
			p: "page",
			l: "line"
		};
		
	if (match[1]) {
		return {
			type: "name",
			name: match[1]
		};
	} else {
		return {
			type: typeTable[match[2]],
			relative: match[4],
			number: +match[3]
		};
	}
}

function goto(s) {
	return s.substring(1).split(",").map(cmd);
}

function getNextKey(key) {
	// are these keycode order?
	var arrowKeys = ["@u", "@d", "@r", "@l"],
		editKeys = ["@H", "@I", "@D", "@E", "@P", "@D"];
		
	if (key.length == 1) {
		if (key != "~") {
			return String.fromCharCode(key.charCodeAt(0) + 1);
		}
		return null;
	}
	
	var i = arrowKeys.indexOf(key);
	if (i >= 0) {
		if (i + 1 < arrowKeys.length) {
			return arrowKeys[i + 1];
		}
		return null;
	}
	
	i = editKeys.indexOf(key);
	if (i >= 0 && i + 1 < editKeys.length) {
		return editKeys[i + 1];
	}
	return null;
}

function input(s) {
	var re = /#([^#,]{0,2}),([^#,]+)(?:,([^#]*))?|#([\d.]+)|#/g,
		match,
		result = {
			wait: null,
			options: []
		},
		defaultKey = "1";
	
	while ((match = re.exec(s))) {
		if (match[2]) {
			var option = {
				key: match[1],
				cmd: cmd(match[2]),
				message: match[3]
			};
			if (!option.key && defaultKey) {
				option.key = defaultKey;
			}
			if (option.key) {
				defaultKey = getNextKey(option.key);
			}
			result.options.push(option);
		} else if (match[4]) {
			result.wait = +match[4];
			if (result.wait < 0.1) {
				result.wait = 0.1;
			}
		}
	}
	
	return result;
}

function keep(s) {
	s = s.substring(2, s.length - 1);
	var keys = s.match(/@?./g),
		i,
		result = {};
	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = true;
	}
	return result;
}

function control(s, defaultWait) {
	s = s.replace(/^(==)?\^L/, "");
	
	var re = /[\d.]+|P|E|S|O=([\d.]+)|G.+|#(?:[^#]+#)+|K#[^#]+#|:[^:]+:|I(:[^:]+:|[fpl][+-]?\d+),(:[^:]+:|[fpl][+-]?\d+)/g,
		match,
		result = {
			wait: defaultWait,
			pause: false,
			end: false,
			sync: false,
			oldWait: false,
			goto: null,
			input: null,
			keep: null,
			name: null,
			include: null
		};	
	
	while ((match = re.exec(s))) {
		switch (match[0][0]) {
			case "P":
				result.pause = true;
				break;
			case "E":
				result.end = true;
				break;
			case "S":
				result.sync = true;
				break;
			case "O":
				result.oldWait = +match[1];
				if (result.oldWait < 0.1) {
					result.oldWait = 0.1;
				}
				break;
			case "G":
				result.goto = goto(match[0]);
				break;
			case "#":
				result.input = input(match[0]);
				break;
			case "K":
				result.keep = keep(match[0]);
				break;
			case ":":
				result.name = match[0].substring(1, match[0].length - 1);
				break;
			case "I":
				result.include = {
					start: cmd(match[2]),
					end: cmd(match[3])
				};
				break;
			default:
				result.wait = +match[0];
				if (result.wait < 0.1) {
					result.wait = 0.1;
				}
		}
	}
	
	return result;
}

function FrameSet(values, viewer) {
	var i, wait = 1, nameMap = {};
	
	for (i = 0; i < values.length; i++) {
		values[i].control = control(values[i].control, wait);
		wait = values[i].control.wait;
		if (values[i].control.name) {
			nameMap[values[i].control.name] = i;
		}
	}
	
	function resolve(i, cmd$$1) {
		// find next frame
		if (cmd$$1.type == "name") {
			return nameMap[cmd$$1.name];
		}

		if (cmd$$1.type == "frame") {
			// it is confusing when negative
			if (!cmd$$1.relative) {
				return cmd$$1.number - 1;	// frame number starts with 1
			}
			if (cmd$$1.number < 0) {
				return i + cmd$$1.number - 1;	// why? no idea
			}
			return i + cmd$$1.number;
		}
		
		var targetLine, j;
		if (cmd$$1.type == "line") {
			if (cmd$$1.relative) {
				targetLine = values[i].line + cmd$$1.number;
			} else {
				targetLine = cmd$$1.number - 1;	// line number starts with 1
			}
		} else {
			/* It seems that this is how pmore works with pages:
			(not sure)
			
			0. A page has 23 lines.
			1. Find the page number of the line of the ^LG tag. (line // 23)
			2. + cmd.number.
			3. Find the ^L tag on target page
			*/
			var pageSize = viewer.getPageSize();
			if (cmd$$1.relative) {
				targetLine = (Math.floor(values[i].line / pageSize) + cmd$$1.number) * pageSize;
			} else {
				targetLine = (cmd$$1.number - 1) * pageSize;	// page number starts with 1
			}
		}
		for (j = 0; j < values.length; j++) {
			if (values[j].line >= targetLine) {
				return j;
			}
		}
		// not found
		return null;
	}
	
	return {
		values: values,
		resolve: resolve
	};
}

function Pmore(frames, viewer) {
	var frameSet = FrameSet(frames, viewer);
	
	var timer, sync, include, current, pause, keep, input, waitInput, inputSelect;
	
	function syncTimeout(fn, delay) {
		if (!sync) {
			timer = setTimeout(fn, delay);
		} else {
			sync.base += delay;
			timer = setTimeout(fn, sync.base - Date.now());
		}
		return timer;
	}
	
	function startOldMode(line, delay) {
		// old mode: always scroll 22 lines down
		function next() {
			if (viewer.scrollToLine(line) !== false) {
				line += 22;
				syncTimeout(next, delay);
			}
		}
		next();
	}
	
	function execute(i) {
		if (i >= frames.length) {
			stop();
			return;
		}
		
		// Not sure if this is the right way.
		if (i < 0) {
			i = 0;
		}
		
		current = i;
		
		var next;
		
		if (include && include.target == i) {
			next = include.back;
			include = null;
			execute(next);
			return;
		}

		var frame = frameSet.values[i],
			control = frame.control;
		
		if (!control.goto && !control.include) {
			// Don't show the frame if it is jump command
			viewer.scrollTo(frame);
		}
		
		if (control.end) {
			// end
			stop();
			return;
		}
		
		if (control.oldWait) {
			// old mode
			startOldMode(frame.line, control.oldWait);
			return;
		}
			
		if (control.sync) {
			// start syncing
			sync = {
				base: Date.now()
			};
		}
		
		if (control.keep) {
			// keep keys
			keep = control.keep;
		}
		
		if (control.pause) {
			pause = true;
			viewer.pause();
			return;
		}
		
		if (control.goto) {
			var j = Math.floor(Math.random() * control.goto.length),
				cmd = control.goto[j];
			
			next = frameSet.resolve(i, cmd);
				
			syncTimeout(function(){
				execute(next);
			}, 0.1 * 1000);
			
			return;
		}
		
		if (control.input) {
			input = control.input;
			if (control.input.options[0].message) {
				inputSelect = 0;
				viewer.inputStart(control.input.options);
				viewer.inputSelect(inputSelect);
			}
			// Input key will reset the timeout
			if (control.input.wait) {
				waitInput = syncTimeout(function(){
					if (input.options[0].message) {
						viewer.inputEnd();
					}
					input = null;
					waitInput = null;
					inputSelect = null;
					execute(i + 1);
				}, control.input.wait * 1000);
			}
			
			return;
		}
		
		if (control.include) {
			next = frameSet.resolve(i, control.include.start);
			include = {
				target: frameSet.resolve(i, control.include.end),
				back: i + 1
			};
			
			syncTimeout(function(){
				execute(next);
			}, 0.1 * 1000);
			return;
		}
		
		// nothing else, just simple ^Lx
		syncTimeout(function(){
			execute(i + 1);
		}, control.wait * 1000);
	}
	
	function start() {
		execute(0);
	}
	
	function stop() {
		// cleanup everything
		clearTimeout(timer);
		timer = null;
		sync = null;
		include = null;
		current = null;
		if (pause) {
			viewer.unpause();
			pause = null;
		}
		keep = null;
		if (input && input.options[0].message) {
			viewer.inputEnd();
		}
		input = null;
		clearTimeout(waitInput);
		waitInput = null;
		viewer.end();
	}
	
	function trigger(key) {
		if (key == "q") {
			viewer.forceEnd();
			stop();
			return;
		}
		
		if (pause) {
			pause = null;
			viewer.unpause();
			if (sync) {
				sync.base = Date.now();
			}
			execute(current + 1);
			return;
		}
		
		if (input) {
			var i, cmd;
			
			// handle select
			if (key == " " || key == "\n") {
				cmd = input.options[inputSelect ? inputSelect : 0].cmd;
			}
			
			for (i = 0; i < input.options.length; i++) {
				if (input.options[i].key == key || input.options[i].key == "@a") {
					cmd = input.options[i].cmd;
					break;
				}
			}
			
			if (cmd) {
				var next = frameSet.resolve(current, cmd);
				if (sync) {
					sync.base = Date.now();
				}
				if (input.options[0].message) {
					viewer.inputEnd();
				}
				input = null;
				clearTimeout(waitInput);
				waitInput = null;
				inputSelect = null;
				execute(next);
				return;
			}
			
			// handle menu option select
			if (inputSelect != null) {
				if (key == "@l") {
					inputSelect--;
					if (inputSelect < 0) {
						inputSelect = 0;
					}
					viewer.inputSelect(inputSelect);
				} else if (key == "@r") {
					inputSelect++;
					if (inputSelect >= input.options.length) {
						inputSelect = input.options.length - 1;
					}
					viewer.inputSelect(inputSelect);
				}
			}
		}
		
		
		if (!input && (!keep || !keep["@a"] && !keep[key])) {
			viewer.forceEnd();
			stop();
		}
	}
	
	return {
		start: start,
		stop: stop,
		trigger: trigger
	};
}

function createKeyRedirecter(pmore) {
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
  return {start, stop};
  
  function start() {
    document.addEventListener("keydown", handleKeyDown);
  }
  
  function stop() {
    document.removeEventListener("keydown", handleKeyDown);
  }
  
  function handleKeyDown(e) {
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
  }
}

function createViewer(onend) {
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
      if (onend) {
        onend();
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
    
    const pmore = Pmore(frames, createViewer(onend));
    const keyRedirecter = createKeyRedirecter(pmore);
    keyRedirecter.start();
    pmore.start();
    
    function onend() {
      keyRedirecter.stop();
    }
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

/* eslint-env webextensions */

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

function init() {
	document.documentElement.style.background = "black";
  const pendingRoot = drawRoot();
  const pendingBinary = getBinary(location.href);
  const pendingANSI = pendingBinary.then(compileANSI);
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

if (
  document.contentType == "text/plain" ||
  document.contentType == "text/x-ansi" ||
  document.contentType == "text/ansi"
) {
  init();
}
