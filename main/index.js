// Load/Unlod modules
var ppmm = require("resource://gre/modules/Services.jsm").Services.ppmm;

ppmm.loadProcessScript(module.uri + "/../e10s-loader.js", true);

function main() {
	ppmm.broadcastAsyncMessage("ansi-viewer-load");
	require("./context-menu").init();
	require("./ansi").init();
}

function onUnload() {
	ppmm.removeDelayedProcessScript(module.uri + "/../e10s-loader.js");
	
	ppmm.broadcastAsyncMessage("ansi-viewer-unload");
	require("./context-menu").uninit();
	require("./ansi").uninit();
}

module.exports = {
	main: main,
	onUnload: onUnload
};
