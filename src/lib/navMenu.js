/**
 * Navigation Menu Module
 * Handles race search functionality
 */

import { fetchRacesFromAPI, getStatewideRaces } from './googleSheets.js';
import { base } from '$app/paths';
import { goto } from '$app/navigation';

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
		
		// Set up event listeners
		setupEventListeners();
		
	} catch (error) {
		console.error('Error initializing navigation menu:', error);
	}
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
