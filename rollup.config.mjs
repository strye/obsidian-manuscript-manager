// rollup --config
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-import-css';
import htmlString from 'rollup-plugin-html-string';

export default {
	input: './src/plugin.js',
  
	output: [
		{ // required (can be an array, for multiple outputs)
			file: './main.js',
			format: 'cjs', // required
		},
		{ // required (can be an array, for multiple outputs)
			file: './dist/main.js',
			format: 'cjs', // required
		},
	],
	plugins: [
		htmlString(),
		css(),
		copy({
			targets: [
				{ src: './manifest.json', dest: './dist' }
			]
		})
	]
};