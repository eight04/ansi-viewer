import resolve from "rollup-plugin-node-resolve";
import cjs from "rollup-plugin-cjs-es";
import json from "rollup-plugin-json";
import re from "rollup-plugin-re";

export default {
  input: [
    "src/background.js",
    "src/content.js",
    "src/ansi-worker.js"
  ],
  output: {
    dir: "extension/js",
    format: "es"
  },
  plugins: [
    resolve(),
    json(),
    cjs({nested: true}),
    re({
      patterns: [
        {
          test: /\bimport\(.+?\)/g,
          replace: "null"
        }
      ]
    })
  ],
  experimentalCodeSplitting: true,
  context: "self"
};
