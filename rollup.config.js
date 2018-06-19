import path from "path";
import resolve from "rollup-plugin-node-resolve";
import cjs from "rollup-plugin-cjs-es";
import json from "rollup-plugin-json";

const config = {
  input: [
    "src/background.js",
    "src/content.js",
    "src/content-detect.js",
    "src/content-worker.js"
  ],
  output: {
    dir: "js",
    format: "es"
  },
  plugins: [
    resolve(),
    json(),
    cjs({nested: true})
  ],
  experimentalCodeSplitting: true,
  context: "self"
};

// if (process.env.WORKER) {
  // config.input = "src/content-worker.js";
  // config.output.format = "es";
  // config.experimentalCodeSplitting = false;
// }

export default config;
