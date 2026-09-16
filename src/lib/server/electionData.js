// @ts-nocheck
import candidateSnapshot from '../../../static/data/candidates.json';
import questionSnapshot from '../../../static/data/candidate-questions.json';
import raceSnapshot from '../../../static/data/races.json';
import storySnapshot from '../../../static/data/sheets-stories.json';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const SITE_URL = 'https://wisconsin-watch.github.io/2026-wiswatch-voter-guide';

const RACE_CONFIG = {
	assembly: {
		displayName: 'Wisconsin State Assembly',
		sheetName: 'Assembly',
		hasMap: true
	},
	senate: {
		displayName: 'Wisconsin State Senate',
		sheetName: 'Senate',
		hasMap: true
	},
	congress: {
		displayName: 'U.S. House of Representatives',
		sheetName: 'US Congress',
		hasMap: true
	},
	governor: {
		displayName: 'Wisconsin Governor',
		sheetName: 'Governor',
		raceId: 'go-1',
		hasMap: false
	},
	'governor-republican-primary': {
		displayName: 'Wisconsin Governor Republican Primary',
		sheetName: 'Governor',
		raceId: 'go-r',
		hasMap: false
	},
	'governor-democrat-primary': {
		displayName: 'Wisconsin Governor Democratic Primary',
		sheetName: 'Governor',
		raceId: 'go-d',
		hasMap: false
	},
	'attorney-general': {
		displayName: 'Wisconsin Attorney General',
		sheetName: 'Attorney General',
		raceId: 'ag-1',
		hasMap: false
	},
	'lieutenant-gov': {
		displayName: 'Wisconsin Lieutenant Governor',
		sheetName: 'Lieutenant Gov',
		raceId: 'lg-1',
		hasMap: false
	},
	treasurer: {
		displayName: 'Wisconsin State Treasurer',
		sheetName: 'Treasurer',
		raceId: 'tr-1',
		hasMap: false
	},
	'secretary-of-state': {
		displayName: 'Wisconsin Secretary of State',
		sheetName: 'Secretary of State',
		raceId: 'sc-1',
		hasMap: false
	}
};

const candidates = candidateSnapshot.candidates || [];
const sheets = raceSnapshot.sheets || {};
const stories = storySnapshot.stories || [];
const candidateImageDirectory = resolve(process.cwd(), 'static/graphics/candidates');
const candidateImageFiles = new Set(readdirSync(candidateImageDirectory));

function withCandidateImage(candidate) {
	if (!candidate) return candidate;
	const jpg = `${candidate.candidate_id}.jpg`;
	const upperJpg = `${candidate.candidate_id}.JPG`;
	const file = candidateImageFiles.has(jpg)
		? jpg
		: candidateImageFiles.has(upperJpg)
			? upperJpg
			: 'winner-who.png';
	return { ...candidate, _imagePath: `/graphics/candidates/${file}` };
}

function racesForSheet(sheetName) {
	const sheet = sheets[sheetName];
	if (!sheet) return [];
	return Array.isArray(sheet) ? sheet : sheet.races || [];
}

function candidateIdsForRace(race) {
	const ids = [];
	for (let index = 1; index <= 9; index += 1) {
		const id = race[`candidate-${index}`];
		if (id) ids.push(id);
	}
	return ids;
}

function candidatesForRace(race) {
	const raceCandidates = [];
	for (let index = 1; index <= 9; index += 1) {
		const candidateId = race[`candidate-${index}`];
		if (!candidateId) continue;
		const candidate = candidates.find((item) => item.candidate_id === candidateId);
		if (!candidate) continue;

		raceCandidates.push(withCandidateImage({
			...candidate,
			incumbent: race.incumbent === candidateId ? 'TRUE' : '',
			status: race[`candidate-${index}-status`] || ''
		}));
	}

	return raceCandidates.sort((a, b) => {
		const inactive = (candidate) => ['dropped-out', 'lost-primary'].includes(
			String(candidate.status || '').trim().toLowerCase()
		);
		const inactiveA = inactive(a);
		const inactiveB = inactive(b);
		if (inactiveA !== inactiveB) return inactiveA ? 1 : -1;

		const lastName = (candidate) => String(candidate.name || '')
			.trim()
			.split(/\s+/)
			.at(-1)
			.toLowerCase();
		return lastName(a).localeCompare(lastName(b))
			|| String(a.name).localeCompare(String(b.name));
	});
}

function configForRace(sheetName, race) {
	if (sheetName === 'Assembly') return ['assembly', RACE_CONFIG.assembly];
	if (sheetName === 'Senate') return ['senate', RACE_CONFIG.senate];
	if (sheetName === 'US Congress') return ['congress', RACE_CONFIG.congress];
	if (race['race-id'] === 'go-r') return ['governor-republican-primary', RACE_CONFIG['governor-republican-primary']];
	if (race['race-id'] === 'go-d') return ['governor-democrat-primary', RACE_CONFIG['governor-democrat-primary']];

	const match = Object.entries(RACE_CONFIG).find(([, config]) => config.sheetName === sheetName && config.raceId === race['race-id']);
	return match || [null, null];
}

function canonicalRaceDistrict(slug, race) {
	return RACE_CONFIG[slug]?.hasMap ? race['race-id'] : '1';
}

function textOnly(value = '') {
	return String(value)
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function descriptionForRace(displayName, race, raceCandidates) {
	const district = race['district-number'] ? ` District ${race['district-number']}` : '';
	const names = raceCandidates.map((candidate) => candidate.name).filter(Boolean);
	const overview = textOnly(race['district-race-nutshell'] || race['district-info']);
	const fallback = `Compare candidates${names.length ? ` ${names.join(', ')}` : ''} in the 2026 ${displayName}${district} election. Read the Wisconsin Watch nonpartisan voter guide.`;
	return (overview || fallback).slice(0, 158);
}

export function canonicalUrl(path = '/') {
	const suffix = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`;
	return `${SITE_URL}${suffix}`;
}

export function getRaceEntries() {
	const entries = [];
	for (const [sheetName, sheet] of Object.entries(sheets)) {
		const races = Array.isArray(sheet) ? sheet : sheet.races || [];
		for (const race of races) {
			const [raceType] = configForRace(sheetName, race);
			if (!raceType) continue;
			entries.push({
				race_type: raceType,
				district: canonicalRaceDistrict(raceType, race)
			});
		}
	}
	return entries;
}

export function getRaceCandidateEntries() {
	const entries = new Map();
	for (const [sheetName, sheet] of Object.entries(sheets)) {
		const races = Array.isArray(sheet) ? sheet : sheet.races || [];
		for (const race of races) {
			const [raceType] = configForRace(sheetName, race);
			if (!raceType) continue;
			for (const candidateId of candidateIdsForRace(race)) {
				const key = `${raceType}:${candidateId}`;
				entries.set(key, { race_type: raceType, candidate_id: candidateId });
			}
		}
	}
	return [...entries.values()];
}

export function getCandidateEntries() {
	return candidates
		.filter((candidate) => candidate.candidate_id)
		.map((candidate) => ({ candidate_id: candidate.candidate_id }));
}

export function getRacePage(raceType, district) {
	const config = RACE_CONFIG[raceType];
	if (!config) return null;

	const raceId = config.hasMap ? district : config.raceId;
	const race = racesForSheet(config.sheetName).find((item) => item['race-id'] === raceId);
	if (!race) return null;

	const raceCandidates = candidatesForRace(race);
	const districtLabel = race['district-number'] ? ` District ${race['district-number']}` : '';
	const pageTitle = `${config.displayName}${districtLabel} election and candidates | Wisconsin Watch`;
	const canonicalDistrict = canonicalRaceDistrict(raceType, race);

	return {
		race,
		candidates: raceCandidates,
		stories: stories.filter((story) => story.race_id === race['race-id']),
		positionInfo: sheets[config.sheetName]?.information || '',
		raceTypeParam: raceType,
		district: canonicalDistrict,
		seo: {
			title: pageTitle,
			description: descriptionForRace(config.displayName, race, raceCandidates),
			canonical: canonicalUrl(`race/${raceType}/${canonicalDistrict}`),
			image: raceCandidates[0]?._imagePath
				? `${SITE_URL}${raceCandidates[0]._imagePath}`
				: `${SITE_URL}/graphics/banner/Banner_PC.svg`
		}
	};
}

export function findRaceForCandidate(candidateId, requestedRaceType) {
	const matches = [];
	for (const [sheetName, sheet] of Object.entries(sheets)) {
		for (const race of Array.isArray(sheet) ? sheet : sheet.races || []) {
			if (!candidateIdsForRace(race).includes(candidateId)) continue;
			const [raceType, config] = configForRace(sheetName, race);
			if (raceType && config) matches.push({ race, raceType, config });
		}
	}

	return matches.find((match) => match.raceType === requestedRaceType)
		|| matches.find((match) => !match.raceType.includes('primary'))
		|| matches[0]
		|| null;
}

export function getCandidatePage(candidateId, requestedRaceType) {
	const candidate = candidates.find((item) => item.candidate_id === candidateId);
	if (!candidate) return null;

	const raceMatch = findRaceForCandidate(candidateId, requestedRaceType);
	const raceName = raceMatch
		? `${raceMatch.config.displayName}${raceMatch.race['district-number'] ? ` District ${raceMatch.race['district-number']}` : ''}`
		: '2026 Wisconsin election';
	const descriptionParts = [
		`${candidate.name} is a candidate in the ${raceName}.`,
		candidate.party ? `${candidate.party}.` : '',
		'Read their background and questionnaire responses in the Wisconsin Watch voter guide.'
	].filter(Boolean);

	return {
		candidate: withCandidateImage(candidate),
		questions: questionSnapshot,
		raceId: raceMatch ? canonicalRaceDistrict(raceMatch.raceType, raceMatch.race) : null,
		raceTypeParam: requestedRaceType || raceMatch?.raceType || null,
		config: raceMatch
			? { displayName: raceMatch.config.displayName, raceType: raceMatch.config.sheetName }
			: null,
		seo: {
			title: `${candidate.name}: 2026 Wisconsin candidate guide | Wisconsin Watch`,
			description: descriptionParts.join(' ').slice(0, 158),
			canonical: canonicalUrl(`candidate/${candidateId}`),
			image: `${SITE_URL}${withCandidateImage(candidate)._imagePath}`
		}
	};
}

export function getRaceDirectory() {
	return getRaceEntries()
		.map(({ race_type, district }) => getRacePage(race_type, district))
		.filter(Boolean)
		.map((page) => ({
			name: page.seo.title.replace(' election and candidates | Wisconsin Watch', ''),
			href: new URL(page.seo.canonical).pathname
		}));
}

export function getCandidateDirectory() {
	return candidates
		.filter((candidate) => candidate.candidate_id && candidate.name)
		.map((candidate) => ({
			name: candidate.name,
			party: candidate.party || '',
			href: `/2026-wiswatch-voter-guide/candidate/${candidate.candidate_id}/`
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export const lastModified = raceSnapshot.lastUpdated || candidateSnapshot.lastUpdated;
