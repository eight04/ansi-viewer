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

function documentReady() {
	return new Promise(resolve => {
		if (document.readyState != "loading") {
			resolve();
			return;
		}
		document.addEventListener("DOMContentLoaded", resolve);
	});
}

function viewAsANSI() {
	document.documentElement.style.background = "black";
	
	// fetch dosnt' work on chrome?
	// Fetch API cannot load file:///... URL scheme must be "http" or "https" for CORS request.
	// fetch(location.href)
		// .then(r => r.arrayBuffer().then(buffer2str))
	getBinary(location.href)
		.then(buffer2str)
		.catch(() => documentReady().then(() => document.body.textContent))
		.then(function(content) {
			return runtime.sendMessage({
				type: "BINSTR2ANSI",
				binary: content
			});
		})
		.then(function (options) {
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
	return ;
}

runtime.onMessage.addListener(msg => {
	if (msg.type == "VIEW_AS_ANSI") {
		viewAsANSI();
	}
});

function shouldViewAsANSI() {
	if (document.contentType == "text/x-ansi") {
		return true;;
	}
	if (document.contentType == "text/plain") {
		if (/\.(ans|bbs|ansi)$/i.test(location.pathname)) {
			return true;
		}
		if (document.cookie.includes("ansi=true")) {
			return true;
		}
	}
	return false;
}

if (shouldViewAsANSI()) {
	viewAsANSI();
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
