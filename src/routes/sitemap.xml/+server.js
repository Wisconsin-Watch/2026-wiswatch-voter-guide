import {
	canonicalUrl,
	getCandidateEntries,
	getRaceEntries,
	lastModified
} from '$lib/server/electionData.js';

export const prerender = true;

/** @param {string} value */
function escapeXml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function GET() {
	const staticPaths = ['/', '/races', '/candidates', '/constitution-amendment-questions'];
	const racePaths = getRaceEntries().map(
		({ race_type, district }) => `/race/${race_type}/${district}`
	);
	const candidatePaths = getCandidateEntries().map(
		({ candidate_id }) => `/candidate/${candidate_id}`
	);
	const paths = [...staticPaths, ...racePaths, ...candidatePaths];
	const urls = paths.map((path) => {
		const loc = path === '/' ? canonicalUrl('/') : canonicalUrl(path);
		return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastModified)}</lastmod>\n  </url>`;
	});

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
	);
}
