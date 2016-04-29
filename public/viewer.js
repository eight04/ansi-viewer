setInterval(function () {
	document.body.classList.toggle("flink");
}, 1000);

var keyMap = {
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
	Delete: "@D"
};

var pmore;

document.addEventListener("keydown", function(e) {
	if (e.key == "l" && e.altKey) {
		document.body.classList.toggle("invert");
		return;
	}
	
	if (!pmore) {
		return;
	}
	
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
	}
});

function grabFrames() {
	var lines = document.querySelectorAll(".line"),
		i, result = [], frames = [];
		
	for (i = 0; i < lines.length; i++) {
		if (/^\^L/.test(lines[i].textContent)) {
			result.push({
				line: i,
				control: lines[i].textContent
			});
			frames.push(lines[i]);
		}
	}
	return {
		result: result,
		frames: frames
	};
}

function Viewer(frames) {
	return {
		scrollTo: function(i) {
			frames[i].nextSibling.scrollIntoView();
		},
		scrollToLine: function(i) {
			document.querySelectorAll(".line")[i].scrollToView();
		},
		getPageSize: function() {
			return 24;
		},
		pause: function() {
			console.log("pause");
		},
		unpause: function() {
			console.log("unpause");
		},
		forceEnd: function() {
			console.log("force end");
		},
		inputStart: function(options) {
			console.log("input start", options);
		},
		inputEnd: function() {
			console.log("input end");
		},
		inputSelect: function(i) {
			console.log("input select", i);
		}
	};
}

document.addEventListener("DOMContentLoaded", function(){
	var o = grabFrames();
	if (!o.frames.length) {
		return;
	}
	if (!confirm("要執行動畫嗎？")) {
		return;
	}
	pmore = Pmore(o.result, Viewer(o.frames));
	pmore.start();
});
