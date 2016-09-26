var bbsReader = require("bbs-reader"),
	uao = require("uao-js"),
	ppmm = require("resource://gre/modules/Services.jsm").Services.ppmm;
	
function ANSIResult(content) {
	this.result = bbsReader(content);
	this.result.title = this.result.title || "ANSI Viewer";
}

ANSIResult.scripts = [
	module.uri + "/../../node_modules/pmore/dist/pmore.js",
	module.uri + "/../../public/viewer.js"
];

ANSIResult.styles = [
	module.uri + "/../../node_modules/bbs-reader/bbs-reader.css",
	module.uri + "/../../public/viewer.css"
];

ANSIResult.prototype.decodeUAO = function() {
	if (this.result.title) {
		this.result.title = uao.decode(this.result.title);
	}
	if (this.result.html) {
		this.result.html = uao.decode(this.result.html);
	}
};

ANSIResult.prototype.toHTML = function() {
	var html = "<!DOCTPYE><html><head><title>" + this.result.title + "</title>",
		i;
		
	for (i = 0; i < ANSIResult.styles.length; i++) {
		html += "<link rel='stylesheet' href='" + ANSIResult.styles[i] + "'>";
	}
	
	for (i = 0; i < ANSIResult.scripts.length; i++) {
		html += "<script src='" + ANSIResult.scripts[i] + "'></script>";
	}
	
	html += "</head><body>" + this.toBody() + "</body></html>";
	
	return html;
};

ANSIResult.prototype.toBody = function() {
	return "<div class='bbs'>" + this.result.html + "</div><div class='statusbar'></div>";
};

function ansiService(message) {
	var ansi = new ANSIResult(message.data);
	ansi.decodeUAO();
	return ansi.toHTML();
}

module.exports = {
	ANSI: ANSIResult,
	init: function(){
		ppmm.addMessageListener("ansi-viewer-ansi-service", ansiService);
	},
	uninit: function() {
		ppmm.removeMessageListener("ansi-viewer-ansi-service", ansiService);
	}
};
