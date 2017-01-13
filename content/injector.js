/* eslint-env webextensions, browser */

var {runtime} = browser;

function snapshotHTML() {
	var html = document.documentElement.outerHTML,
		encodedHTML = encodeURIComponent(html),
		uri = "data:text/html;charset=utf8," + encodedHTML,
		{offsetWidth: width, offsetHeight: height} = document.querySelector(".bbs");
		
	window.open(uri, "Ctrl-S to save", `menubar=0,toolbar=0,location=0,personalbar=0,status=0,width=${width},height=${height}`);
}

runtime.onMessage.addListener(function(message, sender, sendResponse) {
	var type = message.type;
	if (type == "INJECTOR_CHECK") {
		sendResponse(true);
	} else if (type == "SNAPSHOT") {
		snapshotHTML();
	}
});

fetch(location.href).then(function(response) {
	return response.arrayBuffer();
}).then(function(buffer) {
	var arr = new Uint8Array(buffer),
		str = String.fromCharCode.apply(String, arr);
		
	runtime.sendMessage({
		type: "BINSTR2ANSI",
		binary: str
	}).then(inject);
});

function inject(options) {
	document.documentElement.innerHTML = "";

	document.title = options.title;

	document.body.innerHTML = options.body;

	var i,
		ct = document.createDocumentFragment(),
		link,
		script;
		
	for (i = 0; i < options.styles.length; i++) {
		link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = options.styles[i];
		ct.appendChild(link);
	}

	for (i = 0; i < options.scripts.length; i++) {
		script = document.createElement("script");
		script.src = options.scripts[i];
		script.async = false;
		script.charset = "utf-8";
		ct.appendChild(script);
	}

	document.head.appendChild(ct);
}
