import { getCandidateDirectory } from '$lib/server/electionData.js';

export function load() {
	return { candidates: getCandidateDirectory() };
}
