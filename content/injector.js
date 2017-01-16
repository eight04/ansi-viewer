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

function hash(text) {
	var buffer = new TextEncoder().encode(text);
	return crypto.subtle.digest("SHA-256", buffer)
		.then(hash => Array.from(new Uint8Array(hash))
			.map(n => ("0" + n.toString(16))
				.slice(-2))
			.join("")
			.slice(0, 7)
		);
}

class ANSILoader {
	constructor() {
		this.hash = null;
	}
	
	load() {
		// fetch dosnt' work on chrome?
		// Fetch API cannot load file:///... URL scheme must be "http" or "https" for CORS request.
		return getBinary(location.href)
			.then(buffer2str)
			// .catch(() => documentReady().then(() => document.body.textContent))
			.then(content => hash(content)
				.then(hashed => ({
					content: content,
					currHash: hashed,
					prevHash: this.hash
				}))
			)
			.then(result => {
				if (result.currHash == result.prevHash) {
					return;
				}
				this.hash = result.currHash;
				
				return runtime.sendMessage({
					type: "BINSTR2ANSI",
					binary: result.content
				}).then(options => {
					if (!result.prevHash) {
						if (options.title) {
							document.title = options.title;
						}
						document.body.style.visibility = "hidden";
						document.body.innerHTML = options.body;
						
						options.styles.map(injectStyle);
						options.scripts.map(injectScript);
					} else {
						document.body.innerHTML = options.body;
					}
				});
			});
	}
}

function viewAsANSI() {
	document.documentElement.style.background = "black";
	
	var ansiLoader = new ANSILoader;
	if (location.protocol == "file:") {
		(function loop(){
			ansiLoader
				.load()
				.then(() => {
					setTimeout(loop, 2000);
				});
		})();
	} else {
		ansiLoader.load();
	}
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

runtime.onMessage.addListener(msg => {
	if (msg.type == "VIEW_AS_ANSI") {
		viewAsANSI();
	}
});

function shouldViewAsANSI() {
	if (document.contentType == "text/x-ansi") {
		return true;
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
