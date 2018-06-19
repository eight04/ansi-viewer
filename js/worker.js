var _require__$table$u2b_json_ = {
	"my/name": "u2b"
};

var u2b = ({
	default: _require__$table$u2b_json_
});

var _require__$table$b2u_json_ = {
	"my/name": "b2u"
};

var b2u = ({
	default: _require__$table$b2u_json_
});

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

// import bbsReader from "bbs-reader";

onconnect = e => {
  const port = e.ports[0];
  port.onmessage = e => {
    const binary = e.data;
    const {title, html} = bbsReader(binary);
    title = _export_decodeSync_(title);
    html = _export_decodeSync_(html);
    port.postMessage({title, html});
  };
  port.start();
};
