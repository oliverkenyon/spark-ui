import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/app.js',
  dest: 'dist/rollup-bundle.js',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: 'es2015-rollup'
    })
  ]
}
