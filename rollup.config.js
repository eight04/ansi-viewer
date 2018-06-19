import path from "path";
import resolve from "rollup-plugin-node-resolve";
import cjs from "rollup-plugin-cjs-es";
import json from "rollup-plugin-json";

export default {
  // input: [
    // "src/background.js",
    // "src/content.js",
    // "src/content-detect.js",
    // "src/content-worker-core.js"
  // ],
  input: "src/content-worker-core.js",
  output: {
    file: "js/worker.js",
    format: "es",
    freeze: false
  },
  plugins: [
    resolve(),
    json(),
    cjs({nested: true})
  ],
  external: [
    // path.resolve("node_modules/uao-js/table/u2b.json")
  ],
  // experimentalCodeSplitting: true,
  context: "self"
};
