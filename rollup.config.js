import path from "path";
import resolve from "rollup-plugin-node-resolve";
import cjs from "rollup-plugin-cjs-es";
import json from "rollup-plugin-json";

export default {
  input: [
    "src/background.js",
    "src/content.js",
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
