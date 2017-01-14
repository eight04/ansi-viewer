/* eslint-env webextensions, browser */

var {runtime} = browser;

window.injected = true;

function snapshotHTML() {
	var html = document.documentElement.outerHTML,
		encodedHTML = encodeURIComponent(html),
		uri = "data:text/html;charset=utf8," + encodedHTML,
		{offsetWidth: width, offsetHeight: height} = document.querySelector(".bbs");
		
	window.open(uri, "Ctrl-S to save", `menubar=0,toolbar=0,location=0,personalbar=0,status=0,width=${width},height=${height}`);
}

function buffer2str(buffer) {
	var arr = new Uint8Array(buffer),
		i, s = "";
		
	for (i = 0; i < arr.length; i++) {
		s += String.fromCharCode(arr[i]);
	}
	
	return s;
}

function viewAsANSI() {
	document.documentElement.innerHTML = "";

	document.title = "Fetching...";
	fetch(location.href).then(function(response) {
		document.title = "Reading...";
		return response.arrayBuffer();
	}).then(function(buffer) {
		document.title = "Converting...";
		runtime.sendMessage({
			type: "BINSTR2ANSI",
			binary: buffer2str(buffer)
		}).then(inject);
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

function inject(options) {
	document.title = "Injecting...";
	document.body.innerHTML = options.body;
	
	Promise.all(options.styles.map(injectStyle)).then(function(){
		document.title = options.title;
		document.body.classList.add("injected");
	});
	
	options.scripts.map(injectScript);
}

if (document.contentType == "text/plain") {
	viewAsANSI();
}
