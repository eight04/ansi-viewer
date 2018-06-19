import {decodeSync as uaoDecode} from "uao-js";
// import bbsReader from "bbs-reader";

onconnect = e => {
  const port = e.ports[0];
  port.onmessage = e => {
    const binary = e.data;
    const {title, html} = bbsReader(binary);
    title = uaoDecode(title);
    html = uaoDecode(html);
    port.postMessage({title, html});
  };
  port.start();
};

