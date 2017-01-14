var {runtime} = browser;

function getPageInfo() {
	return {
		contentType: document.contentType,
		injected: window.injected
	};
}

runtime.onMessage.addListener(function(message, sender, sendResponse) {
	var type = message.type;
	if (type == "PAGE_INFO") {
		sendResponse(getPageInfo());
	}
});

getPageInfo();
