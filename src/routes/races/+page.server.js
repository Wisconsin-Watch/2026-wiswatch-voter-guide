import { getRaceDirectory } from '$lib/server/electionData.js';

export function load() {
	return { races: getRaceDirectory() };
}
