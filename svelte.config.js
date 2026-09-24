import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: false
		}),
		paths: {
			base: ''
		},
		prerender: {
			handleMissingId: 'warn',
			handleUnseenRoutes: 'warn'
		}
	}
};

export default config;
