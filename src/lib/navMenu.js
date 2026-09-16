/**
 * Navigation Menu Module
 * Handles race search functionality
 */

import { fetchCandidatesFromAPI, fetchRacesFromAPI, getAvailableSheets, getStatewideRaces } from './googleSheets.js';
import { base } from '$app/paths';

// District-based race types - these are constant
const DISTRICT_RACES = [
	{ value: 'Assembly', label: 'State Assembly', hasDistricts: true },
	{ value: 'Senate', label: 'State Senate', hasDistricts: true },
	{ value: 'US Congress', label: 'U.S. Congress', hasDistricts: true }
];

// Races that have sub-race options instead of districts
const SUB_RACE_OPTIONS = {
	'Governor': [
		{ label: 'Republican Primary', raceTypeParam: 'governor-republican-primary', raceId: 'go-r' },
		{ label: 'Democrat Primary', raceTypeParam: 'governor-democrat-primary', raceId: 'go-d' },
		{ label: 'General Race', raceTypeParam: 'governor', raceId: '1' }
	]
};

let RACE_TYPES = [...DISTRICT_RACES];
let raceTypeData = {};
let candidatesByName = new Map();
let searchableCandidates = [];
let highlightedCandidateIndex = -1;

const DISTRICT_RACE_SLUGS = {
	Assembly: 'assembly',
	Senate: 'senate',
	'US Congress': 'congress'
};

function getLastName(name = '') {
	const parts = name.trim().split(/\s+/);
	return parts[parts.length - 1] || '';
}

function normalizeName(name = '') {
	return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function raceTypeToSlug(sheetName, raceId) {
	if (raceId === 'go-r') return 'governor-republican-primary';
	if (raceId === 'go-d') return 'governor-democrat-primary';
	return DISTRICT_RACE_SLUGS[sheetName] || sheetName.toLowerCase().replace(/\s+/g, '-');
}

function getRaceLabel(sheetName, race) {
	if (race['race-id'] === 'go-r') return 'Governor Republican Primary';
	if (race['race-id'] === 'go-d') return 'Governor Democratic Primary';

	const districtNumber = race['district-number'];
	if (districtNumber) {
		const displayName = {
			Assembly: 'State Assembly',
			Senate: 'State Senate',
			'US Congress': 'U.S. Congress'
		}[sheetName] || sheetName;
		return `${displayName} District ${districtNumber}`;
	}

	return sheetName;
}

/**
 * Initialize the navigation menu
 */
async function init() {
	try {
		// Load statewide races dynamically
		const statewideRaces = await getStatewideRaces();
		RACE_TYPES = [...DISTRICT_RACES, ...statewideRaces];
		
		// Populate race type dropdown
		populateRaceTypes();
		await populateCandidateSearch();
		
		// Set up event listeners
		setupEventListeners();
		
	} catch (error) {
		console.error('Error initializing navigation menu:', error);
	}
}

/**
 * Build a candidate-to-race index from the same snapshots used by race pages.
 * Candidates in a current/general race take precedence when an ID also occurs
 * in a primary race.
 */
async function populateCandidateSearch() {
	const input = document.getElementById('candidate-search-input');
	const optionsList = document.getElementById('candidate-options');
	const status = document.getElementById('candidate-search-status');
	if (!input || !optionsList) return;

	input.disabled = true;
	input.placeholder = 'Loading candidates...';

	try {
		const [candidates, sheetNames] = await Promise.all([
			fetchCandidatesFromAPI(),
			getAvailableSheets()
		]);
		const sheetRaces = await Promise.all(
			sheetNames.map(async sheetName => ({
				sheetName,
				races: await fetchRacesFromAPI(sheetName)
			}))
		);

		const raceByCandidateId = new Map();
		for (const { sheetName, races } of sheetRaces) {
			for (const race of races) {
				for (let i = 1; i <= 9; i++) {
					const candidateId = race[`candidate-${i}`];
					if (!candidateId || raceByCandidateId.has(candidateId)) continue;
					raceByCandidateId.set(candidateId, {
						raceId: race['race-id'],
						raceTypeSlug: raceTypeToSlug(sheetName, race['race-id']),
						raceLabel: getRaceLabel(sheetName, race)
					});
				}
			}
		}

		searchableCandidates = candidates
			.filter(candidate => candidate.name && raceByCandidateId.has(candidate.candidate_id))
			.map(candidate => ({ ...candidate, ...raceByCandidateId.get(candidate.candidate_id) }))
			.sort((a, b) =>
				getLastName(a.name).localeCompare(getLastName(b.name), undefined, { sensitivity: 'base' }) ||
				a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
			);

		candidatesByName = new Map(
			searchableCandidates.map(candidate => [normalizeName(candidate.name), candidate])
		);
		renderCandidateOptions(searchableCandidates);

		input.disabled = false;
		input.placeholder = 'Type or select a candidate...';
		if (status) status.textContent = '';
	} catch (error) {
		console.error('Error loading candidate search:', error);
		input.placeholder = 'Candidates unavailable';
		if (status) status.textContent = 'Candidate search is temporarily unavailable.';
	}
}

function renderCandidateOptions(candidates) {
	const optionsList = document.getElementById('candidate-options');
	if (!optionsList) return;

	const fragment = document.createDocumentFragment();
	let currentInitial = '';
	for (const candidate of candidates) {
		const initial = getLastName(candidate.name).charAt(0).toLocaleUpperCase();
		if (initial !== currentInitial) {
			const divider = document.createElement('div');
			divider.className = 'candidate-alpha-divider';
			divider.textContent = initial;
			divider.setAttribute('aria-hidden', 'true');
			fragment.appendChild(divider);
			currentInitial = initial;
		}

		const option = document.createElement('button');
		option.type = 'button';
		option.className = 'candidate-option';
		option.dataset.candidateName = candidate.name;
		option.setAttribute('role', 'option');
		option.textContent = candidate.name;
		option.addEventListener('mousedown', event => event.preventDefault());
		option.addEventListener('click', () => selectCandidate(candidate.name));
		fragment.appendChild(option);
	}

	optionsList.replaceChildren(fragment);
	highlightedCandidateIndex = -1;
}

function showCandidateOptions() {
	const input = document.getElementById('candidate-search-input');
	const optionsList = document.getElementById('candidate-options');
	if (!input || !optionsList || input.disabled) return;
	optionsList.hidden = false;
	input.setAttribute('aria-expanded', 'true');
}

function hideCandidateOptions() {
	const input = document.getElementById('candidate-search-input');
	const optionsList = document.getElementById('candidate-options');
	if (!input || !optionsList) return;
	optionsList.hidden = true;
	input.setAttribute('aria-expanded', 'false');
	highlightedCandidateIndex = -1;
}

function selectCandidate(name) {
	const input = document.getElementById('candidate-search-input');
	if (!input) return;
	input.value = name;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	hideCandidateOptions();
	input.focus();
}

function moveCandidateHighlight(direction) {
	const optionsList = document.getElementById('candidate-options');
	if (!optionsList) return;
	const options = Array.from(optionsList.querySelectorAll('.candidate-option'));
	if (!options.length) return;

	highlightedCandidateIndex = (highlightedCandidateIndex + direction + options.length) % options.length;
	options.forEach((option, index) => option.classList.toggle('highlighted', index === highlightedCandidateIndex));
	options[highlightedCandidateIndex].scrollIntoView({ block: 'nearest' });
}

/**
 * Populate the race type dropdown
 */
function populateRaceTypes() {
	const raceTypeSelect = document.getElementById('race-type-select');
	if (!raceTypeSelect) return;
	
	// Clear existing options except the first one
	raceTypeSelect.innerHTML = '<option value="">Select race type...</option>';
	
	RACE_TYPES.forEach(race => {
		const option = document.createElement('option');
		option.value = race.value;
		option.textContent = race.label;
		option.dataset.hasDistricts = race.hasDistricts;
		raceTypeSelect.appendChild(option);
	});
}

/**
 * Set up event listeners for the menu
 */
function setupEventListeners() {
	// Race type selection
	const raceTypeSelect = document.getElementById('race-type-select');
	if (raceTypeSelect) {
		raceTypeSelect.addEventListener('change', handleRaceTypeChange);
	}
	
	// District selection
	const districtSelect = document.getElementById('district-select');
	if (districtSelect) {
		districtSelect.addEventListener('change', handleDistrictChange);
	}
	
	// Race search button
	const raceSearchBtn = document.getElementById('race-search-btn');
	if (raceSearchBtn) {
		raceSearchBtn.addEventListener('click', handleRaceSearch);
	}

	const candidateInput = document.getElementById('candidate-search-input');
	const candidateSearchBtn = document.getElementById('candidate-search-btn');
	if (candidateInput) {
		candidateInput.addEventListener('input', handleCandidateInput);
		candidateInput.addEventListener('focus', () => {
			handleCandidateInput({ target: candidateInput });
			showCandidateOptions();
		});
		candidateInput.addEventListener('blur', hideCandidateOptions);
		candidateInput.addEventListener('keydown', event => {
			const optionsList = document.getElementById('candidate-options');
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				showCandidateOptions();
				moveCandidateHighlight(event.key === 'ArrowDown' ? 1 : -1);
			} else if (event.key === 'Enter' && highlightedCandidateIndex >= 0 && optionsList) {
				event.preventDefault();
				const options = optionsList.querySelectorAll('.candidate-option');
				const highlighted = options[highlightedCandidateIndex];
				if (highlighted) selectCandidate(highlighted.dataset.candidateName);
			} else if (event.key === 'Enter' && candidatesByName.has(normalizeName(candidateInput.value))) {
				event.preventDefault();
				handleCandidateSearch();
			} else if (event.key === 'Escape') {
				hideCandidateOptions();
			}
		});
	}
	if (candidateSearchBtn) {
		candidateSearchBtn.addEventListener('click', handleCandidateSearch);
	}
}

function handleCandidateInput(event) {
	const candidateSearchBtn = document.getElementById('candidate-search-btn');
	const status = document.getElementById('candidate-search-status');
	const candidate = candidatesByName.get(normalizeName(event.target.value));
	const hasMatch = Boolean(candidate);
	const query = normalizeName(event.target.value);
	const filteredCandidates = query
		? searchableCandidates.filter(item => normalizeName(item.name).includes(query))
		: searchableCandidates;
	renderCandidateOptions(filteredCandidates);
	showCandidateOptions();
	if (candidateSearchBtn) candidateSearchBtn.disabled = !hasMatch;
	if (status) {
		status.textContent = candidate
			? `Participating race: ${candidate.raceLabel}`
			: event.target.value
				? 'Select a name from the candidate list.'
				: '';
		status.classList.toggle('candidate-race-match', hasMatch);
	}
}

function handleCandidateSearch() {
	const input = document.getElementById('candidate-search-input');
	const status = document.getElementById('candidate-search-status');
	const candidate = input ? candidatesByName.get(normalizeName(input.value)) : null;
	if (!candidate) {
		if (status) status.textContent = 'Select a name from the candidate list.';
		return;
	}

	closeMenu();
	window.location.href = `${base}/race/${candidate.raceTypeSlug}/${candidate.raceId}`;
}

/**
 * Handle race type selection change
 */
async function handleRaceTypeChange(e) {
	const raceType = e.target.value;
	const selectedOption = e.target.options[e.target.selectedIndex];
	const hasDistricts = selectedOption.dataset.hasDistricts === 'true';
	
	const districtGroup = document.getElementById('district-select-group');
	const districtSelect = document.getElementById('district-select');
	const raceSearchBtn = document.getElementById('race-search-btn');
	
	if (!raceType) {
		districtGroup.style.display = 'none';
		raceSearchBtn.style.display = 'none';
		return;
	}
	
	if (hasDistricts) {
		// Load districts for this race type
		await loadDistricts(raceType);
		districtGroup.style.display = 'block';
		raceSearchBtn.style.display = 'none';
	} else if (SUB_RACE_OPTIONS[raceType]) {
		// Show sub-race picker (e.g. Governor primaries vs general)
		loadSubRaceOptions(raceType);
		districtGroup.style.display = 'block';
		raceSearchBtn.style.display = 'none';
	} else {
		// No districts needed
		districtGroup.style.display = 'none';
		raceSearchBtn.style.display = 'block';
	}
}

/**
 * Load sub-race options (e.g. Governor primaries vs general)
 */
function loadSubRaceOptions(raceType) {
	const districtSelect = document.getElementById('district-select');
	if (!districtSelect) return;

	const options = SUB_RACE_OPTIONS[raceType];
	districtSelect.innerHTML = '<option value="">Select race...</option>';
	options.forEach(opt => {
		const option = document.createElement('option');
		option.value = opt.raceId;
		option.dataset.raceTypeParam = opt.raceTypeParam;
		option.textContent = opt.label;
		districtSelect.appendChild(option);
	});
}

/**
 * Load districts for a specific race type
 */
async function loadDistricts(raceType) {
	const districtSelect = document.getElementById('district-select');
	if (!districtSelect) return;
	
	districtSelect.innerHTML = '<option value="">Loading...</option>';
	
	try {
		// Fetch race data from the Elections Running 2026 spreadsheet
		const races = await fetchRacesFromAPI(raceType);
		raceTypeData[raceType] = races;
		
		// Get unique districts and their corresponding race-ids
		const districtMap = new Map();
		races.forEach(race => {
			const districtNum = race['district-number'];
			const raceId = race['race-id'];
			if (districtNum && raceId) {
				districtMap.set(districtNum, raceId);
			}
		});
		
		// Sort districts numerically
		const districts = Array.from(districtMap.keys()).sort((a, b) => {
			const numA = parseInt(a);
			const numB = parseInt(b);
			return numA - numB;
		});
		
		districtSelect.innerHTML = '<option value="">Select district...</option>';
		districts.forEach(districtNum => {
			const option = document.createElement('option');
			option.value = districtNum;
			option.dataset.raceId = districtMap.get(districtNum);
			option.textContent = `District ${districtNum}`;
			districtSelect.appendChild(option);
		});
	} catch (error) {
		console.error('Error loading districts:', error);
		districtSelect.innerHTML = '<option value="">Error loading districts</option>';
	}
}

/**
 * Handle district selection change
 */
function handleDistrictChange(e) {
	const raceSearchBtn = document.getElementById('race-search-btn');
	if (!raceSearchBtn) return;
	
	if (e.target.value) {
		raceSearchBtn.style.display = 'block';
	} else {
		raceSearchBtn.style.display = 'none';
	}
}

/**
 * Handle race search button click
 */
function handleRaceSearch() {
	const raceTypeSelect = document.getElementById('race-type-select');
	const districtSelect = document.getElementById('district-select');
	
	if (!raceTypeSelect) return;
	
	const raceType = raceTypeSelect.value;
	const selectedOption = raceTypeSelect.options[raceTypeSelect.selectedIndex];
	const hasDistricts = selectedOption.dataset.hasDistricts === 'true';
	
	if (!raceType) {
		alert('Please select a race type');
		return;
	}
	
	let raceTypeParam = '';
	let raceId = '';
	
	// Determine race type parameter - convert to slug format
	if (raceType === 'Assembly') {
		raceTypeParam = 'assembly';
	} else if (raceType === 'Senate') {
		raceTypeParam = 'senate';
	} else if (raceType === 'US Congress') {
		raceTypeParam = 'congress';
	} else {
		// For any statewide race, convert to slug format
		raceTypeParam = raceType.toLowerCase().replace(/\s+/g, '-');
	}
	
	// Get race-id if applicable
	if (SUB_RACE_OPTIONS[raceType]) {
		// Governor-style: district select holds sub-race options
		if (!districtSelect || !districtSelect.value) {
			alert('Please select a race');
			return;
		}
		const selectedOption = districtSelect.options[districtSelect.selectedIndex];
		raceTypeParam = selectedOption.dataset.raceTypeParam || raceTypeParam;
		raceId = selectedOption.value;
	} else if (hasDistricts) {
		if (!districtSelect || !districtSelect.value) {
			alert('Please select a district');
			return;
		}
		// Get the race-id from the selected district option
		const selectedDistrictOption = districtSelect.options[districtSelect.selectedIndex];
		raceId = selectedDistrictOption.dataset.raceId;
		
		if (!raceId) {
			alert('Error: Race ID not found');
			return;
		}
	} else {
		// For statewide races, use race-id = 1
		raceId = '1';
	}
	
	const url = `${base}/race/${raceTypeParam}/${raceId}`;
	closeMenu();
	 window.location.href = (url);
}

/**
 * Close the navigation menu
 */
function closeMenu() {
	const overlay = document.querySelector('.nav-menu-overlay');
	const menu = document.querySelector('.nav-menu');
	
	if (overlay) {
		overlay.classList.remove('open');
	}
	if (menu) {
		menu.classList.remove('open');
	}
}

export default {
	init
};
