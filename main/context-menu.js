var cm = require("sdk/context-menu"),
	ansi2html = require("./ansi2html");
	
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
				var html = ansi2html(content);
				tab.attach({
					contentScript: "document.documentElement.innerHTML = self.options.html",
					contentScriptOptions: {
						html: html.match(/<html>([\s\S]*)<\/html>/)[1]
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
