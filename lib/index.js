var {CC, Cc, Cu, Ci} = require("chrome"),
    {Class} = require("sdk/core/heritage"),
    {Unknown, Service} = require("sdk/platform/xpcom"),
    categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager),
    {NetUtil} = Cu.import("resource://gre/modules/NetUtil.jsm"),
    {uao} = require("./uao/uao"),
    ScriptableUnicodeConverter = CC("@mozilla.org/intl/scriptableunicodeconverter", "nsIScriptableUnicodeConverter");
    
// Remove label before colon.
function stripColon(text) {
    var i = text.indexOf(":");
    if (i >= 0) {
        text = text.substr(i).trim();
        if (text[1] == " ") {
            text = text.substr(1).trim();
        }
    }
    return text;
}

// Split right label
function splitLabel(text) {
    var label = "", right = "";
    var i = text.lastIndexOf(":");
    if (i >= 0) {
        right = text.substr(i + 1).trim();
        if (right) {
            text = text.substr(0, i);
            
            i = text.lastIndexOf(" ");
            if (i >= 0) {
                label = text.substr(i + 1);
                if (label) {
                    text = text.substr(0, i);
                }
            }
        }
    }
    return [text, label, right];
}

// create span tag with color
function makeSpan(color, half) {
    return "<span class='f" + color.f + " b" + color.b + " l" + color.l + (half ? " half" : "") + (color.flash ? " flash" : "") + "'>";
}

// create head line
function makeHead(lLabel, lText, rLabel, rText) {
    if (!lText) {
        return "";
    }
    
    var fillSpace = 78, result = "";
    
    fillSpace -= 2 + lLabel.length + 1 + lText.length;
    
    if (rText) {
        fillSpace -= 2 + rLabel.length + 2 + rText.length;
    }
    
    if (fillSpace < 0) {
        fillSpace = 0;
    }
    
    result += "<div class='line'><span class='f4 b7'>&nbsp;" + lLabel + "&nbsp;</span><span class='f7 b4'>&nbsp;" + escape(lText) + "&nbsp;".repeat(fillSpace) + "</span>";
    
    if (rText) {
        result += "<span class='f4 b7'>&nbsp;" + escape(rLabel) + "&nbsp;</span><span class='f7 b4'>&nbsp;" + escape(rText) + "&nbsp;</span>";
    }
    
    result += "</div>";
    
    return result;
}

// extract text to color
function extractColor(text, i, color) {
    var re = /\033\[([\d;]*)m/g;
    re.lastIndex = i;
    var match = re.exec(text);
    if (!match || match.index != i) {
        return -1;
    }
    var tokens = match[1].split(";");
    var j, code;
    for (j = 0; j < tokens.length; j++) {
        code = +tokens[j];
        if (code == 0) {
            color.l = 0;
            color.f = 7;
            color.b = 0;
        } else if (code == 1) {
            color.l = 1;
        } else if (code == 5) {
            color.flash = true;
        } else if (code == 7) {
            var t = color.f;
            color.f = color.b;
            color.b = t;
        } else if (code < 40) {
            color.f = code - 30;
        } else if (code < 50) {
            color.b = code - 40;
        }
    }
    return re.lastIndex;
}

// escape character to html entity
function escape(s) {
    var table = {
        "<": "&lt",
        "&": "&amp;",
        " ": "&nbsp;",
        "\n": "<br>",
        "\r": ""
    };
    var s2 = "", i;
    
    for (i = 0; i < s.length; i++) {
        if (table[s[i]]) {
            s2 += table[s[i]];
        } else {
            s2 += s[i];
        }
    }
    
    return s2;
}
    
// ANSI Viewer, convert text/ansi to text/html
var Viewer = Class({
    extends: Unknown,
    interfaces: [
        "nsIStreamConverter",
        "nsIStreamListener",
        "nsIRequestObserver"
    ],
    
    initialize: function(){
        this.left = null;
        this.right = null;
        this.data = "";
        this.count = 0;
    },
    
    convert: function(aFromStream, aFromType, aToType, sCtxt) { // eslint-disable-line
        return aFromStream;
    },
    
    asyncConvertData: function(aFromType, aToType, aListener, aCtxt) { // eslint-disable-line
        this.listener = aListener;
    },
    
    onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
        this.data += NetUtil.readInputStreamToString(aInputStream, aCount);
        this.count += aCount;
    },
    
    onStartRequest: function(aRequest, aContext) { // eslint-disable-line
        aRequest.QueryInterface(Ci.nsIChannel);
        aRequest.contentType = "text/html";
        aRequest.contentCharset = "utf-8";
    },
    
    onStopRequest: function(aRequest, aContext, aStatusCode) {
        var self = this;
        var headRE = /^(\xa7@\xaa\xcc:.*)\n(.*)\n(.*)\n/,
            i = 0, match, result = "",
            color = {
                l: 0,
                f: 7,
                b: 0,
                flash: false
            },
            pos = 0;
            
        if ((match = headRE.exec(this.data))) {
            // draw header
            var author, title, time, label, board;
            
            author = stripColon(match[1]);
            title = stripColon(match[2]);
            time = stripColon(match[3]);
            
            // find board
            [author, label, board] = splitLabel(author);
            
            // 作者
            result += makeHead("\xa7@\xaa\xcc", author, label, board);
            // 標題
            result += makeHead("\xbc\xd0\xc3D", title);
            // 時間
            result += makeHead("\xae\xc9\xb6\xa1", time);
            
            // ─
            result += "<div class='line'><span class='f6'>" + "\xa2w".repeat(39) + "</span></div>";
            
            i += match[0].length;
        }
        
        color.l = 0;
        color.f = 7;
        color.b = 0;
        
        result += "<div class='line'>" + makeSpan(color);
        
        var j;
        
        for (; i < this.data.length; i++) {
            if (this.data[i] == "\x1b") {
                // ESC
                if (!this.left) {
                    result += "</span>";
                    j = extractColor(this.data, i, color);
                    result += makeSpan(color);
                    if (j >= 0) {
                        i = j - 1;
                    } else {
                        result += "*";
                        pos++;
                    }
                } else {
                    result += this.left;
                    pos++;
                    j = extractColor(this.data, i, color);
                    if (j >= 0) {
                        if (j < this.data.length) {
                            result += this.data[j] + "</span>" + makeSpan(color, true) + this.left + this.data[j];
                            pos++;
                        } else {
                            result += "</span>" + makeSpan(color, true);
                        }
                        i = j;
                    } else {
                        result += "*";
                        pos++;
                    }
                    this.left = null;
                }
            } else if (this.left) {
                var ch = this.left + this.data[i];
                if (ch == "\xa1\xb0" && pos == 0) {
                    // ※
                    color.f = 2;
                    color.b = 0;
                    color.l = 0;
                    result += "</span>" + makeSpan(color) + ch;
                // } else if ((ch == "\xb1\xc0" || ch == "\xbcN" || ch == "\xa1\xf7") && pos == 0) {
                    // 推噓→
                    // result += "<span class='push'>" + ch + "</span>";
                } else {
                    result += ch;
                }
                pos += 2;
                this.left = null;
            } else if (this.data.charCodeAt(i) & 0x80) {
                // Big5 high byte
                this.left = this.data[i];
            } else if (this.data[i] == "\n") {
                result += "</span></div><div class='line'>" + makeSpan(color);
                pos = 0;
            } else {
                result += escape(this.data[i]);
                pos++;
            }
        }
        
        result += "</span></div>";
        
        result = "<!DOCTPYE><html><head><link rel='stylesheet' href='" + module.uri + "/../style.css'></head><body>" + result + "</body></html>";
        
        uao.b2u(result, function(result) {
            var converter = new ScriptableUnicodeConverter();
            converter.charset = "UTF-8";
            var output = converter.convertToInputStream(result);
            
            self.listener.onStartRequest(aRequest, aContext); 
            
            self.listener.onDataAvailable(aRequest, aContext, output, 0, output.available());
            
            self.listener.onStopRequest(aRequest, aContext, aStatusCode);
            
            self.initialize();
        });            
    }
});

// Main entry
function main() {
    categoryManager.addCategoryEntry("ext-to-type-mapping", "ans", "text/ansi", false, true);
    
    Service({
        contract: "@mozilla.org/streamconv;1?from=text/ansi&to=*/*",
        Component: Viewer
    });    
}

exports.main = main;
