(function(){
	if (typeof require === "undefined") {
		var {Loader, main} = Components.utils.import(
			"resource://gre/modules/commonjs/toolkit/loader.js", {});
		
		var loader = Loader({
			paths: {
				"devtools/": "resource://devtools/",
				"": "resource://gre/modules/commonjs/"
			}
		});

		main(loader, "resource://ansi-viewer/main/e10s-loader");
		return;
	}
	
	var cpmm = require("resource://gre/modules/Services.jsm").Services.cpmm;
		
	function handleLoad() {
		require("./category").init();
		require("./viewer").init();
	}

	function handleUnload() {
		require("./category").uninit();
		require("./viewer").uninit();
		
		cpmm.removeMessageListener("ansi-viewer-load", handleLoad);
		cpmm.removeMessageListener("ansi-viewer-unload", handleUnload);
	}

	cpmm.addMessageListener("ansi-viewer-load", handleLoad);
	cpmm.addMessageListener("ansi-viewer-unload", handleUnload);
	
})();
