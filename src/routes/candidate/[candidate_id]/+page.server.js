import { error } from '@sveltejs/kit';
import { getCandidateEntries, getCandidatePage } from '$lib/server/electionData.js';

export const entries = getCandidateEntries;

export function load({ params }) {
	const page = getCandidatePage(params.candidate_id);
	if (!page) error(404, 'Candidate not found');
	return page;
}
