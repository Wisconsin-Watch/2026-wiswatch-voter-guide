import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	// Fetch stories from static JSON file (updated daily by GitHub Action)
	/** @type {Array<{id: string, title: string, url: string, creator: string, pubDate: string, image: string, imageAlt: string, imageSrcset: string, imageSizes: string, imageWidth: string, imageHeight: string}>} */
	let stories = [];
	
	try {
		const response = await fetch(`${base}/data/stories.json`);
		if (response.ok) {
			const data = await response.json();
			stories = (data.stories || []).slice(0, 4); // Change 4 to your desired number
			console.log(`Loaded ${stories.length} stories (last updated: ${data.lastUpdated})`);
		} else {
			console.warn('Stories JSON not found, using empty array');
		}
	} catch (error) {
		console.error('Error loading stories:', error);
		// Return empty array on error so the page still loads
		stories = [];
	}
	
	return {
		stories,
		mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
	};
}
