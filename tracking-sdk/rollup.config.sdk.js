import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

export default {
  input: 'src/sdk/index.ts',
  output: [
    {
      file: 'dist/sdk.js',
      format: 'iife',
      name: 'TrackerSDK',
      sourcemap: true,
    },
    {
      file: 'dist/sdk.min.js',
      format: 'iife',
      name: 'TrackerSDK',
      sourcemap: true,
      plugins: [terser({
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: true,
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
      })],
    },
  ],
  plugins: [
    nodeResolve({
      browser: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
    }),
    filesize({
      showGzippedSize: true,
      showBrotliSize: false,
    }),
  ],
};