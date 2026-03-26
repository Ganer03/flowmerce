import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.mjs", format: "esm" },
      { file: "dist/index.cjs", format: "cjs" }
    ],
    plugins: [esbuild()],
    external: [
      'handlebars',
      '@flowmerce/core',
      'stream', 'events', 'fs', 'path', 'util', 'crypto', 'os', 'zlib', 'http', 'https', 'net', 'tls', 'dns', 'child_process', 'cluster', 'repl', 'vm', 'module', 'assert', 'buffer', 'process', 'global', 'console', 'require', '__dirname', '__filename'
    ],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
  },
];