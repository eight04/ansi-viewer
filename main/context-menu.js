var cm = require("sdk/context-menu"),
	ANSI = require("./ansi").ANSI;
	
function init() {
	cm.Item({
		label: "View as ANSI",
		context: cm.PredicateContext(function(context){
			return context.documentType == "text/plain";
		}),
		contentScript: "self.on('click', self.postMessage)",
		onMessage: function(){
			var tab = require("sdk/tabs").activeTab,
				readURI = require("sdk/net/url").readURI;
				
			readURI(tab.url, {
				charset: "latin1"
			}).then(function(content){
				var ansi = new ANSI(content);
				ansi.decodeUAO();
				
				tab.attach({
					contentScriptFile: "./injector.js",
					contentScriptOptions: {
						title: ansi.result.title,
						styles: ANSI.styles,
						scripts: ANSI.scripts,
						body: ansi.toBody()
					}
				});
			});
		}
	});
}

module.exports = {
	init: init,
	uninit: function(){
		// should we remove something here?
	}
};
