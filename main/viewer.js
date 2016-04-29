var {Class} = require("sdk/core/heritage"),
	{Unknown, Service} = require("sdk/platform/xpcom"),
	{CC, Cu, Ci} = require("chrome"),
	
	{NetUtil} = Cu.import("resource://gre/modules/NetUtil.jsm"),
	ScriptableUnicodeConverter = CC(
		"@mozilla.org/intl/scriptableunicodeconverter", "nsIScriptableUnicodeConverter"
	),
	
	uao = require("uao-js"),
	bbsReader = require("bbs-reader");
	
function createViewer() {
    return Class({
        extends: Unknown,
        
        interfaces: [
            "nsIStreamConverter",
            "nsIStreamListener",
            "nsIRequestObserver"
        ],
        
        initialize: function(){
            this.data = "";
        },
        
        convert: function(aFromStream, aFromType, aToType, sCtxt) { // eslint-disable-line
            return aFromStream;
        },
        
        asyncConvertData: function(aFromType, aToType, aListener, aCtxt) { // eslint-disable-line
            this.listener = aListener;
        },
        
        onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
            this.data += NetUtil.readInputStreamToString(aInputStream, aCount);
        },
        
        onStartRequest: function(aRequest, aContext) { // eslint-disable-line
            aRequest.QueryInterface(Ci.nsIChannel);
            aRequest.contentType = "text/html";
            aRequest.contentCharset = "utf-8";
        },
        
        onStopRequest: function(aRequest, aContext, aStatusCode) {
            
            var result = bbsReader(this.data);
                
            result = "<!DOCTPYE><html><head><title>" + (result.title ? result.title : "ANSI Viewer") + "</title><script src='" + module.uri + "/../../node_modules/pmore/dist/pmore.js'></script><link rel='stylesheet' href='" + module.uri + "/../../node_modules/bbs-reader/bbs-reader.css'><link rel='stylesheet' href='" + module.uri + "/../../public/viewer.css'><script src='" + module.uri + "/../../public/viewer.js'></script></head><body><div class='bbs'>" + result.html + "</div><div class='statusbar'></div></body></html>";
            
            result = uao.decode(result);
            
            var converter = new ScriptableUnicodeConverter();
            converter.charset = "UTF-8";
            var output = converter.convertToInputStream(result);
            
            this.listener.onStartRequest(aRequest, aContext); 
            
            this.listener.onDataAvailable(aRequest, aContext, output, 0, output.available());
            
            this.listener.onStopRequest(aRequest, aContext, aStatusCode);
            
            this.initialize();
        }
    });
}
	
function init() {
    Service({
        contract: "@mozilla.org/streamconv;1?from=text/ansi&to=*/*",
        Component: createViewer()
    });
}

function uninit() {
    // https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/platform_xpcom#Implementing_XPCOM_Services
    // The service will unregister it self so we have nothing to do here?
}

module.exports = {
    init: init,
    uninit: uninit
};
