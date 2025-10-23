import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

export default {
  input: 'src/loader/index.ts',
  output: [
    {
      file: 'dist/loader.js',
      format: 'iife',
      sourcemap: false,
    },
    {
      file: 'dist/loader.min.js',
      format: 'iife',
      sourcemap: false,
      plugins: [terser({
        compress: {
          passes: 3,
          pure_getters: true,
          unsafe: true,
          drop_console: true,
        },
        mangle: true,
      })],
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
    filesize({
      showGzippedSize: true,
      showBrotliSize: false,
    }),
  ],
};