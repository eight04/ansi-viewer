/* eslint-env webextensions, browser */

var {runtime} = browser;

window.injected = true;

function buffer2str(buffer) {
	var arr = new Uint8Array(buffer),
		i, s = "";
		
	for (i = 0; i < arr.length; i++) {
		s += String.fromCharCode(arr[i]);
	}
	
	return s;
}

function viewAsANSI() {
	document.documentElement.style.background = "black";

	fetch(location.href).then(function(response) {
		return response.arrayBuffer();
	}).then(function(buffer) {
		return runtime.sendMessage({
			type: "BINSTR2ANSI",
			binary: buffer2str(buffer)
		});
	}).then(function (options) {
		if (options.title) {
			document.title = options.title;
		}
		document.body.style.visibility = "hidden";
		document.body.innerHTML = options.body;
		
		options.styles.map(injectStyle);
		options.scripts.map(injectScript);
	});
}

function injectStyle(url) {
	return new Promise(function(resolve) {
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = url;
		link.onload = resolve;
		document.head.appendChild(link);
	});
}

function injectScript(url) {
	return new Promise(function(resolve) {
		var script = document.createElement("script");
		script.src = url;
		script.async = false;
		script.charset = "utf-8";
		script.onload = resolve;
		document.head.appendChild(script);
	});
}

function isANSI(path) {
	return /\.(ans|bbs|ansi)$/i.test(path);
}

runtime.onMessage.addListener(msg => {
	if (msg.type == "VIEW_AS_ANSI") {
		viewAsANSI();
	}
});

if (document.contentType == "text/x-ansi" || document.contentType == "text/plain" && isANSI(location.pathname)) {
	viewAsANSI();
}
