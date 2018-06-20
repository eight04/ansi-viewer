import {decodeSync as uaoDecode} from "uao-js";
import bbsReader from "bbs-reader";

function blob2binaryString(blob) {
  return new FileReader().readAsBinaryString(blob);
}

function compileANSI(binaryString) {
  const result = bbsReader(binaryString);
  return {
    title: result.title && uaoDecode(result.title),
    html: result.html && uaoDecode(result.html)
  };
}

self.addEventListener("message", e => {
  Promise.resolve()
    .then(() => compileANSI(e.data.data))
    .then(data => ({
      error: false,
      data,
      requestId: e.data.requestId
    }))
    .catch(err => ({
      error: true,
      data: err,
      requestId: e.data.requestId
    }))
    .then(result => self.postMessage(result));
});
