var cm = require("sdk/context-menu");
	
function init() {
	cm.Item({
		label: "View as ANSI",
		context: cm.PredicateContext(function(context){
			return context.documentType == "text/plain";
		}),
		contentScript: "self.on('click', self.postMessage)",
		onMessage: function(){
			var { activeTab } = require("sdk/tabs"),
				{ XMLHttpRequest } = require("sdk/net/xhr"),
				{ ANSI } = require("./ansi");
				
			function convertANSI(content) {
				var ansi = new ANSI(content);
				ansi.decodeUAO();
				activeTab.attach({
					contentScriptFile: "./injector.js",
					contentScriptOptions: {
						title: ansi.result.title,
						styles: ANSI.styles,
						scripts: ANSI.scripts,
						body: ansi.toBody()
					}
				});
			}
				
			// Do we have better way to get binary string from URI?
			var xhr = new XMLHttpRequest();
			xhr.responseType = "arraybuffer";
			xhr.onload = function() {
				var arr = new Uint8Array(xhr.response),
					str = String.fromCharCode.apply(String, arr);
				convertANSI(str);
			};
			xhr.open("get", activeTab.url);
			xhr.send();				
		}
	});
}

module.exports = {
	init: init,
	uninit: function(){
		// should we remove something here?
	}
};
