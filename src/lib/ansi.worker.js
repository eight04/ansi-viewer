import {decodeSync as uaoDecode} from "uao-js";
import bbsReader from "bbs-reader";

export function compileANSI(binaryString) {
  const result = bbsReader(binaryString);
  return {
    title: result.title && uaoDecode(result.title),
    html: result.html && uaoDecode(result.html)
  };
}
