/* eslint-env commonjs, webextensions */

var {runtime, contextMenus, extension, tabs, commands} = browser,
	{getURL} = extension;

var ANSI = function(){
	var bbsReader = require("bbs-reader"),
		uao = require("uao-js"),
		scripts = [
			getURL("public/pmore.js"),
			getURL("public/viewer.js")
		],
		styles = [
			getURL("public/bbs-reader.css"),
			getURL("public/viewer.css")
		];
	
	class ANSI {
		constructor(content) {
			this.result = bbsReader(content);
			this.result.title = this.result.title;
		}
		decodeUAO() {
			if (this.result.title) {
				this.result.title = uao.decode(this.result.title);
			}
			if (this.result.html) {
				this.result.html = uao.decode(this.result.html);
			}
		}
		toHTML() {
			var html = "<!DOCTPYE><html><head><title>" + this.result.title + "</title>",
				i;
				
			for (i = 0; i < styles.length; i++) {
				html += "<link rel='stylesheet' href='" + styles[i] + "'>";
			}
			
			for (i = 0; i < scripts.length; i++) {
				html += "<script src='" + scripts[i] + "'></script>";
			}
			
			html += "</head><body>" + this.toBody() + "</body></html>";
			
			return html;
		}
		toBody() {
			return "<div class='bbs'>" + this.result.html + "</div><div class='statusbar'></div>";
		}
	}
	
	ANSI.styles = styles;
	ANSI.scripts = scripts;
	
	return ANSI;
}();

// messages
(function() {
	function convertAnsi(content) {
		var ansi = new ANSI(content);
		ansi.decodeUAO();
		return {
			title: ansi.result.title,
			styles: ANSI.styles,
			scripts: ANSI.scripts,
			body: ansi.toBody()
		};
	}
	
	runtime.onMessage.addListener(function(request, sender, sendResponse){
		if (request.type == "BINSTR2ANSI") {
			sendResponse(convertAnsi(request.binary));
		}
	});
})();

function inject(tab) {
	return tabs.sendMessage(tab.id, {
		type: "PAGE_INFO"
	}).then(info => {
		if (info == undefined) {
			throw new Error("No response");
		}
		return info;
	}).catch(() => {
		// recieving end doesn't exist
		return tabs.executeScript(tab.id, {
			file: "/content/injector-gaurd.js"
		}).then(infos => {
			if (!infos.length) {
				throw new Error("Injection failed");
			}
			return infos[0];
		});
	}).then(function(info) {
		if (info.injected) {
			return;
		}
		
		if (info.contentType != "text/plain") {
			throw new Error("Invalid contentType for ANSI: " + info.contentType);
		}
		
		return Promise.all([
			tabs.insertCSS(tab.id, {
				file: "/content/injector.css",
				runAt: "document_start"
			}),
			tabs.executeScript(tab.id, {
				file: "/content/injector.js",
				runAt: "document_start"
			})
		]);
	});
}

// context menu
(function(){
	var VIEW_AS_ANSI = contextMenus.create({
			title: "View as ANSI"
		});
		// SNAPSHOT = contextMenus.create({
			// title: "Take snapshot"
		// });
		
	contextMenus.onClicked.addListener(function(info, tab) {
		var id = info.menuItemId;
		if (id == VIEW_AS_ANSI) {
			inject(tab);
		// } else if (id == SNAPSHOT) {
			// inject(tab).then(function() {
				// return tabs.sendMessage(tab.id, {
					// type: "SNAPSHOT"
				// });
			// });
		}
	});
})();

// commands
(function(){
	commands.onCommand.addListener(function(cmd) {
		if (cmd == "view-as-ansi") {
			tabs.query({
				active: true,
				currentWindow: true
			}).then(function(result) {
				if (result.length) {
					inject(result[0]);
				}
			});
		}
	});
})();
