import _require__$table$b2u_json_ from './b2u.js';
import _require__$table$u2b_json_ from './u2b.js';

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

	createDecodeTableSync = () => _require__$table$b2u_json_;
const _export_decodeSync_ = function (text, createTable = createDecodeTableSync) {
		if (!tableCache.b2u) {
			tableCache.b2u = createTable();
		}
		return decode(tableCache.b2u, text);
	};

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
};

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
    var matches = [],
        match;
		
	text = text.slice(i);
    while ((match = text.match(/^\x1b\[([\d;]*)m/))) {
        matches.push(match);
        text = text.slice(match[0].length);
		i += match[0].length;
    }
    
    if (!matches.length) {
        return null;
    }
    
    var tokens = matches.map(function(match){
        return match[1].split(";");
    });
    
    tokens = Array.prototype.concat.apply([], tokens);
    
    var span = color.copy();
    span.i = i;
    
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
				if (span2.i <= i) {
					throw new Error("bbs-reader crashed! infinite loop");
				}
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

onconnect = e => {
  const port = e.ports[0];
  port.onmessage = e => {
    const binary = e.data;
    let {title, html} = bbsReader(binary);
    title = _export_decodeSync_(title);
    html = _export_decodeSync_(html);
    port.postMessage({title, html});
  };
  port.start();
};
