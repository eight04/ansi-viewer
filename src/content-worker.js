import {decodeSync as uaoDecode} from "uao-js";
import bbsReader from "bbs-reader";

function buffer2str(buffer) {
	var arr = new Uint8Array(buffer),
		i, s = "";
		
	for (i = 0; i < arr.length; i++) {
		s += String.fromCharCode(arr[i]);
	}
	
	return s;
}

function compileANSI(buffer) {
  const result = bbsReader(buffer2str(buffer));
  return {
    title: result.title && uaoDecode(result.title),
    html: result.html && uaoDecode(result.html)
  };
}

self.addEventListener("message", e => {
  let result;
  try {
    result = {
      error: false,
      data: compileANSI(e.data)
    };
  } catch (err) {
    result = {
      error: true,
      data: err
    };
  }
  self.postMessage(result);
});
