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

var escapeTable = {
    "<": "&lt",
    "&": "&amp;",
    " ": "&nbsp;",
    "\n": "<br>",
    "\r": ""
};

// escape character to html entity
function escape(s) {
    var s2 = "", i;
    
    for (i = 0; i < s.length; i++) {
        if (escapeTable[s[i]]) {
            s2 += escapeTable[s[i]];
        } else {
            s2 += s[i];
        }
    }
    
    return s2;
}

// convert ansi string into html    
function bbsReader(data) {
    var i = 0, match, result = "",
        color = {
            l: 0,
            f: 7,
            b: 0,
            flash: false
        },
        pos = 0,    // col position
        left;       // cache the big5 high byte
        
    var author, title, time, label, board;
    
    if ((match = /^(\xa7@\xaa\xcc:.*)\n(.*)\n(.*)\n/.exec(data))) {
        // draw header    
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
    
    for (; i < data.length; i++) {
        if (data[i] == "\x1b") {
            // ESC
            if (!left) {
                result += "</span>";
                j = extractColor(data, i, color);
                result += makeSpan(color);
                if (j >= 0) {
                    i = j - 1;
                } else {
                    result += "*";
                    pos++;
                }
            } else {
                result += left;
                pos++;
                j = extractColor(data, i, color);
                if (j >= 0) {
                    if (j < data.length) {
                        result += data[j] + "</span>" + makeSpan(color, true) + left + data[j];
                        pos++;
                    } else {
                        result += "</span>" + makeSpan(color, true);
                    }
                    i = j;
                } else {
                    result += "*";
                    pos++;
                }
                left = null;
            }
        } else if (left) {
            var ch = left + data[i];
            if (ch == "\xa1\xb0" && pos == 0) {
                // ※
                color.f = 2;
                color.b = 0;
                color.l = 0;
                result += "</span>" + makeSpan(color) + ch;
            } else {
                result += ch;
            }
            pos += 2;
            left = null;
        } else if (data.charCodeAt(i) & 0x80) {
            // Big5 high byte
            left = data[i];
        } else if (data[i] == "\n") {
            result += "</span></div><div class='line'>" + makeSpan(color);
            pos = 0;
        } else {
            result += escape(data[i]);
            pos++;
        }
    }
    
    result += "</span></div>";
    
    return {
        html: result,
        title: title,
        author: author,
        time: time
    };
}

module.exports = bbsReader;
