import { error } from '@sveltejs/kit';
import { getRaceEntries, getRacePage } from '$lib/server/electionData.js';

export const entries = getRaceEntries;

export function load({ params }) {
	const page = getRacePage(params.race_type, params.district);
	if (!page) error(404, 'Race not found');
	return page;
}
