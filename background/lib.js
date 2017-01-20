require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"bbs-reader":[function(require,module,exports){
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

var escapeTable = {
    "<": "&lt;",
    "&": "&amp;"
};

function escapeRepl(match) {
    return escapeTable[match];
}

// escape character to html entity
function escape(s) {
    // this should be safe since there is no CJK contains "&", "<"
    return s.replace(/<|&/g, escapeRepl);
}

function Span(f, b, l) {
    this.f = f;
    this.b = b;
    this.l = l;
    this.flash = false;
    this.halfStart = false;
    this.halfEnd = false;
    this.text = "";
    this.i = 0;
}

Span.prototype.toString = function() {
    if (!this.text) {
        return "";
    }
    
    var cls = "f" + this.f + " b" + this.b,
        w = this.text.length;
        
    if (this.l) {
        cls += " l";
    }
    if (this.flash) {
        cls += " flash";
    }
    if (this.halfStart) {
        cls += " half-start";
        w--;
    }
    if (this.halfEnd) {
        cls += " half-end";
        w--;
    }
    return "<span class='" + cls + "' style='width:" + (w / 2) + "em'>" + escape(this.text) + "</span>";
};

Span.prototype.copy = function() {
    var span = new Span(this.f, this.b, this.l);
    span.flash = this.flash;
    return span;
};

Span.prototype.reset = function() {
    this.f = 7;
    this.b = 0;
    this.l = false;
    this.flash = false;
}

// create head line
function makeHead(lLabel, lText, rLabel, rText) {
    if (!lText) {
        return "";
    }
    
    var fillSpace = 78, result = "<div class='line'>";
    
    fillSpace -= 2 + lLabel.length + 1 + lText.length;
    
    if (rText) {
        fillSpace -= 2 + rLabel.length + 2 + rText.length;
    }
    
    if (fillSpace < 0) {
        fillSpace = 0;
    }
    
    var span = new Span(4, 7, false);
    
    span.text = " " + lLabel + " ";
    
    result += span.toString();
    
    span.f = 7;
    span.b = 4;
    span.text = " " + lText + " ".repeat(fillSpace);
    
    result += span.toString();
    
    // result += makeSpan({f:4,b:7,text:" "+lLabel+" "}) + makeSpan({f:7,b:4,text:" "+lText+" ".repeat(fillSpace)});
    
    if (rText) {
        span.f = 4;
        span.b = 7;
        span.text = " " + rLabel + " ";
        
        result += span.toString();
        
        span.f = 7;
        span.b = 4;
        span.text = " " + rText + " ";
        
        result += span.toString();
        // result += makeSpan({f:4,b:7,text:" "+rLabel+" "}) + makeSpan({f:7,b:4,text:" "+rText+" "});
    }
    
    result += "</div>";
    
    return result;
}

// extract text to color
function extractColor(text, i, color) {
    var re = /\033\[([\d;]*)m/g;
    re.lastIndex = i;
    var matches = [],
        match;
    do {
        match = re.exec(text);
        if (!match || match.index != i) {
            break;
        }
        matches.push(match);
        i = re.lastIndex;
    } while (text[re.lastIndex] == "\x1b");
    
    if (!matches.length) {
        return null;
    }
    
    var tokens = matches.map(function(match){
        return match[1].split(";");
    });
    
    tokens = Array.prototype.concat.apply([], tokens);
    
    var span = color.copy();
    span.i = re.lastIndex;
    
    var code;
    
    for (i = 0; i < tokens.length; i++) {
        code = +tokens[i];
        if (code == 0) {
            span.reset();
        } else if (code == 1) {
            span.l = true;
        } else if (code == 5) {
            span.flash = true;
        } else if (code == 7) {
            var t = span.f;
            span.f = span.b;
            span.b = t;
        } else if (code < 40) {
            span.f = code - 30;
        } else if (code < 50) {
            span.b = code - 40;
        }
    }
    return span;
}

// convert ansi string into html    
function bbsReader(data) {
    var i = 0, match, result = "";
        
    var author, title, time, label, board;
    
    if ((match = /^(\xa7@\xaa\xcc:.*)\n(.*)\n(.*)\n/.exec(data))) {
        // draw header    
        author = stripColon(match[1]);
        title = stripColon(match[2]);
        time = stripColon(match[3]);
        
        // find board
        var t = splitLabel(author);
        author = t[0];
        label = t[1];
        board = t[2];
        
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
    
    var span = new Span(7, 0, false),
        pos = 0, cleanLine = false, cjk = false;
    
    result += "<div class='line'>";
    
    for (; i < data.length; i++) {
        // Special color
        if (pos == 0) {
            var ch = data.substr(i, 2);
            if (ch == "\xa1\xb0") {
                // ※
                cleanLine = true;
                span.reset();
                span.f = 2;
            } else if (ch == ": ") {
                // : 
                cleanLine = true;
                span.reset();
                span.f = 6;
            }
        }
        if (data[i] == "\x1b") {
            // ESC
            var span2 = extractColor(data, i, span);
            if (!span2) {
                span.text += data[i];
                pos++;
            } else if (cjk && data[span2.i] != "\n") {
                span.text += data[span2.i];
                span.halfEnd = true;
                
                result += span.toString();
                
                span2.text += span.text.substring(span.text.length - 2);
                span2.halfStart = true;
                
                pos++;
                i = span2.i;
                span = span2;
                cjk = false;
            } else {
                cjk = false;
                result += span.toString();
                i = span2.i - 1;
                span = span2;
            }
        } else if (data[i] == "\r" && data[i + 1] == "\n") {
            continue;
        } else if (data[i] == "\r" || data[i] == "\n") {
            result += span.toString() + "</div><div class='line'>";
            span.text = "";
            span.halfStart = false;
            span.halfEnd = false;
            cjk = false;
            
            if (cleanLine) {
                span.reset();
                cleanLine = false;
            }
            
            pos = 0;
        } else {
            if (cjk) {
                cjk = false;
            } else if (data.charCodeAt(i) & 0x80) {
                cjk = true;
            }
            span.text += data[i];
            pos++;
        }
    }
    
    result += span.toString() + "</div>";
    
    return {
        html: result,
        title: title,
        author: author,
        time: time
    };
}

module.exports = bbsReader;

},{}],"uao-js":[function(require,module,exports){
function encode(table, string, error) {
	var i = 0, result = "";
	for (; i < string.length; i++) {
		if (table[string[i]]) {
			result += table[string[i]];
		} else if (string.charCodeAt(i) <= 0x80) {
			result += string[i];
		} else if (error != undefined) {
			result += error;
		} else {
			throw new Error(`Can't encode character ${JSON.stringify(string[i])} at index ${i}`);
		}
	}
	return result;
}

function decode(table, bytes) {
	var i = 0, result = "";
	for (; i < bytes.length - 1; i++) {
		if (bytes.charCodeAt(i) > 0x80 && table[bytes[i] + bytes[i + 1]]) {
			result += table[bytes[i] + bytes[i + 1]];
			i++;
		} else {
			result += bytes[i];
		}
	}
	if (i < bytes.length) {
		result += bytes[i];
	}
	return result;
}

var tableCache = {},

	createEncodeTable = () => Promise.resolve(require("./table/u2b.json")),
	createDecodeTable = () => Promise.resolve(require("./table/b2u.json")),
	createEncodeTableSync = () => require("./table/u2b.json"),
	createDecodeTableSync = () => require("./table/b2u.json");

module.exports = {
	encode(text, error, createTable = createEncodeTable) {
		if (!tableCache.u2b) {
			return createTable().then(table => {
				tableCache.u2b = table;
				return encode(table, text, error);
			});
		}
		return Promise.resolve(encode(tableCache.u2b, text, error));
	},
	decode(text, createTable = createDecodeTable) {
		if (!tableCache.b2u) {
			return createTable().then(table => {
				tableCache.b2u = table;
				return decode(table, text);
			});
		}
		return Promise.resolve(decode(tableCache.b2u, text));
	},
	encodeSync(text, error, createTable = createEncodeTableSync) {
		if (!tableCache.u2b) {
			tableCache.u2b = createTable();
		}
		return encode(tableCache.u2b, text, error);
	},
	decodeSync(text, createTable = createDecodeTableSync) {
		if (!tableCache.b2u) {
			tableCache.b2u = createTable();
		}
		return decode(tableCache.b2u, text);
	}
};

},{"./table/b2u.json":undefined,"./table/u2b.json":undefined}]},{},[]);
