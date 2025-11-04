import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';

export default [
  // Development build (readable)
  {
    input: 'src/standalone/hotjar.ts',
    output: {
      file: 'dist/hotjar.js',
      format: 'iife',
      name: 'HJ',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
      }),
      filesize(),
    ],
  },
  // Production build (minified)
  {
    input: 'src/standalone/hotjar.ts',
    output: {
      file: 'dist/hotjar.min.js',
      format: 'iife',
      name: 'HJ',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
      }),
      terser({
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
        format: {
          comments: false,
        },
      }),
      filesize(),
    ],
  },
];
