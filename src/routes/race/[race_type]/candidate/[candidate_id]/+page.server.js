import { error } from '@sveltejs/kit';
import { getCandidatePage, getRaceCandidateEntries } from '$lib/server/electionData.js';

export const entries = getRaceCandidateEntries;

export function load({ params }) {
	const page = getCandidatePage(params.candidate_id, params.race_type);
	if (!page) error(404, 'Candidate not found');
	return page;
}
