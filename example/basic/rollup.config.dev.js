import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import postcss from 'rollup-plugin-postcss'
import serve from 'rollup-plugin-serve'

export default {
  input: './src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    resolve(),
    commonjs(),
    typescript(),
    terser(),
    postcss(),
    serve({
      open: true,
      port: 2333,
      contentBase: './dist',
    }),
  ],
}