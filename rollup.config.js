import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import cjs from "rollup-plugin-cjs-es";
import multi from "rollup-plugin-multi-input";
import iife from "rollup-plugin-iife";
import omt from "@surma/rollup-plugin-off-main-thread";
import comlink from "@surma/rollup-plugin-comlink";
import styles from "rollup-plugin-styles";
import {copy} from "@web/rollup-plugin-copy";
import output from "rollup-plugin-write-output";
import {terser} from "rollup-plugin-terser";
import inject from "@rollup/plugin-inject";

export default {
  input: ["src/*.js"],
  output: {
    dir: "dist",
    format: "esm"
  },
  plugins: [
    multi(),
    resolve(),
    json(),
    styles({
      mode: "extract"
    }),
    cjs({nested: true}),
    comlink({
      autoWrap: [/\.worker\.js/],
      useModuleWorker: false
    }),
    omt(),
    inject({
      browser: "webextension-polyfill",
      exclude: [
        "node_modules/webextension-polyfill/**/*"
      ]
    })
    iife(),
    copy({
      rootDir: "src/static",
      patterns: "**/*"
    }),
    output([
      {
        test: /background\.js/,
        target: "dist/manifest.json",
        handle: (content, {scripts}) => {
          content.background.scripts.push(...scripts);
          return content;
        }
      },
      {
        test: /content\.js/,
        target: "dist/manifest.json",
        handle: (content, {scripts}) => {
          content.content_scripts[0].js.push(...scripts);
          return content;
        }
      },
      {
        test: /content[^\\\/]*\.css/,
        target: "dist/manifest.json",
        handle: (content, {scripts}) => {
          content.content_scripts[0].css.push(...scripts);
          return content;
        }
      },
      {
        test: /(.*\.worker[^\\\/]*\.js)/,
        target: "dist/$1",
        handle: (content, {scripts}) =>
          `importScripts(${JSON.stringify(scripts.slice(0, -1))});\n${content}`
      }
    ]),
    terser({
      module: false
    })
  ],
  context: "self"
};
