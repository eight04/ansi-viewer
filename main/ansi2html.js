var bbsReader = require("bbs-reader"),
	uao = require("uao-js");

function ansi2html(content) {
	var result = bbsReader(content);
		
	result = "<!DOCTPYE><html><head><title>" + (result.title ? result.title : "ANSI Viewer") + "</title><script src='" + module.uri + "/../../node_modules/pmore/dist/pmore.js'></script><link rel='stylesheet' href='" + module.uri + "/../../node_modules/bbs-reader/bbs-reader.css'><link rel='stylesheet' href='" + module.uri + "/../../public/viewer.css'><script src='" + module.uri + "/../../public/viewer.js'></script></head><body><div class='bbs'>" + result.html + "</div><div class='statusbar'></div></body></html>";
	
	return uao.decode(result);
}

module.exports = ansi2html;
