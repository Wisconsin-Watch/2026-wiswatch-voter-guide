/**
 * Google Sheets API Utility
 *
 * Data loading strategy (in order of preference):
 *  1. Static pre-generated JSON files served alongside the site
 *     (static/data/candidates.json, races.json, sheets-stories.json).
 *     These are kept up-to-date by the fetch-sheets GitHub Action and are
 *     the only source used on the deployed GitHub Pages site.
 *  2. Google Sheets API — used as a fallback when the JSON files are absent
 *     (e.g. local development before the first `node scripts/fetch-sheets.js`
 *     run). Results are cached in sessionStorage to conserve API quota.
 */

import { base } from '$app/paths';

const SPREADSHEET_ID = '1H2tgXpnn7kt8KxvPkLSELsU5ohYFM0p2tvBQJi5M44E';
const RACES_SPREADSHEET_ID = '1XecLv5Q-ZFr-5ijvhHqEiVbX6MPl61jJDmiS4GuG-SY';
const STORIES_SPREADSHEET_ID = '19-BcTq-ueiZgxwCjEgTbxPSL2LBLyhjJAYmXQn3Bk-E';

// sessionStorage helpers --------------------------------------------------
const sessionKey = (prefix, id, range) => `gs:${prefix}:${id}:${range}`;

async function cachedFetchJson(cacheKey, fetcher) {
    // To bypass sessionStorage caching during local development, you can:
    // 1) Temporarily enable the DEV bypass by uncommenting the next two lines:
    //  if (import.meta.env && import.meta.env.DEV) {
    //      return fetcher();
    //  }
    // 2) Or set the environment variable `VITE_BYPASS_CACHE=1` and uncomment/use the following:
    //    if (import.meta.env && import.meta.env.VITE_BYPASS_CACHE === '1') {
    //        return fetcher();
    //    }
    //
    // By default caching is enabled to conserve API quota.

    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        // ignore sessionStorage errors (quota, disabled, etc.)
    }

    const data = await fetcher();

    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
        // ignore set errors
    }

    return data;
}

async function fetchSheetValuesWithCache(spreadsheetId, range) {
    const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    const cacheKey = sessionKey('values', spreadsheetId, range);

    return cachedFetchJson(cacheKey, async () => {
        const encodedRange = encodeURIComponent(range);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            const err = new Error(`API error: ${response.status}`);
            err.status = response.status;
            throw err;
        }
        return response.json();
    });
}

async function fetchSpreadsheetMetadataWithCache(spreadsheetId) {
    const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    const cacheKey = sessionKey('meta', spreadsheetId, 'sheets');

    return cachedFetchJson(cacheKey, async () => {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    });
}

// ── Static JSON helpers ───────────────────────────────────────────────────

// Bump this version string any time you make a breaking change to the JSON
// schema (e.g. column renames). It invalidates all existing sessionStorage
// caches for every visitor on their next page load.
const CACHE_VERSION = 'v2';

/**
 * Fetch a pre-generated static JSON file with sessionStorage caching.
 * Returns null (without caching) when the file is not available so that
 * subsequent calls will retry — useful during local development before the
 * first `node scripts/fetch-sheets.js` run.
 */
async function fetchStaticJson(url) {
    const cacheKey = `gs:static:${CACHE_VERSION}:${url}`;
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }

    const response = await fetch(url);
    if (!response.ok) return null; // not found — do not cache

    const data = await response.json();
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch { /* ignore quota errors */ }
    return data;
}

/**
 * Fetch candidate data.
 * Tries static JSON (fast, no quota) first; falls back to the live Sheets API.
 * @param {string} sheetName - Deprecated parameter, kept for backward compatibility.
 * @returns {Promise<Array>} Array of candidate objects
 */
export async function fetchCandidatesFromAPI(sheetName = 'Candidate') {
    // 1. Static pre-generated JSON
    try {
        const json = await fetchStaticJson(`${base}/data/candidates.json`);
        if (json && json.candidates) {
            console.log(`Loaded ${json.candidates.length} candidates from static JSON (updated: ${json.lastUpdated})`);
            return json.candidates;
        }
    } catch { /* fall through */ }

    // 2. Live Google Sheets API
    const range = `'${sheetName}'!A:Z`;
    try {
        const data = await fetchSheetValuesWithCache(SPREADSHEET_ID, range);
        const rows = (data && data.values) || [];

        if (rows.length === 0) return [];

        const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
        return rows.slice(1).map((row, index) => {
            const candidate = { id: index };
            headers.forEach((header, i) => {
                candidate[header] = row[i] || '';
            });
            return candidate;
        });
    } catch (error) {
        console.error('Error fetching from Google Sheets API:', error);
        return fetchCandidatesFromCSV();
    }
}

/**
 * Fallback method: Fetch candidate data from published CSV
 * @returns {Promise<Array>} Array of candidate objects
 */
async function fetchCandidatesFromCSV() {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQpPPS8TGtIZA3FpBVknBwwhNBdf8Mkdh3ctvLtojlKIZcgKpqCvSG5znzjsj8XLlRWdikmaKfdf-aJ/pub?gid=0&single=true&output=csv';

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
        const csvContent = await response.text();

        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        return lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const candidate = { id: index };
            headers.forEach((header, i) => {
                candidate[header] = values[i] || '';
            });
            return candidate;
        });
    } catch (error) {
        console.error('Error fetching CSV:', error);
        throw error;
    }
}

/**
 * Get a single candidate by ID
 * @param {number} id - Candidate ID (row index)
 * @param {string} sheetName - Deprecated parameter, kept for backward compatibility. Always uses "Candidate" tab.
 * @returns {Promise<Object|null>} Candidate object or null if not found
 */
export async function getCandidateById(id, sheetName = 'Candidate') {
    const candidates = await fetchCandidatesFromAPI();
    return candidates.find(c => c.id === parseInt(id)) || null;
}

/**
 * Get a single candidate by candidate_id
 * @param {string} candidateId - Candidate ID string (e.g., 'candidate-1')
 * @param {string} sheetName - Deprecated parameter, kept for backward compatibility. Always uses "Candidate" tab.
 * @returns {Promise<Object|null>} Candidate object or null if not found
 */
export async function getCandidateByCandidateId(candidateId, sheetName) {
    const candidates = await fetchCandidatesFromAPI();
    return candidates.find(c => c.candidate_id === candidateId) || null;
}

/**
 * Fetch race data for a specific sheet tab.
 * Tries static JSON first; falls back to the live Sheets API.
 * @param {string} sheetName - The name of the sheet to fetch from (e.g., 'Assembly', 'Senate', 'US Congress')
 * @returns {Promise<Array>} Array of race objects
 */
export async function fetchRacesFromAPI(sheetName) {
    // 1. Static pre-generated JSON
    try {
        const json = await fetchStaticJson(`${base}/data/races.json`);
        if (json && json.sheets && json.sheets[sheetName]) {
            return json.sheets[sheetName];
        }
    } catch { /* fall through */ }

    // 2. Live Google Sheets API
    const range = `'${sheetName}'!A:Z`;
    try {
        const data = await fetchSheetValuesWithCache(RACES_SPREADSHEET_ID, range);
        const rows = (data && data.values) || [];
        if (rows.length === 0) return [];
        const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
        return rows.slice(1).map((row, index) => {
            const race = { id: index };
            headers.forEach((header, i) => {
                race[header] = row[i] || '';
            });
            return race;
        });
    } catch (error) {
        console.error('Error fetching race data:', error);
        throw error;
    }
}

/**
 * Get a single race by district number
 * @param {string|number} districtNumber - District number
 * @param {string} sheetName - The name of the sheet to fetch from (e.g., 'Assembly', 'Senate', 'US Congress')
 * @returns {Promise<Object|null>} Race object or null if not found
 */
export async function getRaceByDistrict(districtNumber, sheetName) {
    const races = await fetchRacesFromAPI(sheetName);
    return races.find(r => r['district-number'] === String(districtNumber)) || null;
}

/**
 * Get a single race by race ID
 * @param {string} raceId - Race ID (e.g., 'as-1', 'se-1', 'co-1')
 * @param {string} sheetName - The name of the sheet to fetch from (e.g., 'Assembly', 'Senate', 'US Congress')
 * @returns {Promise<Object|null>} Race object or null if not found
 */
export async function getRaceByRaceId(raceId, sheetName) {
    const races = await fetchRacesFromAPI(sheetName);
    return races.find(r => r['race-id'] === raceId) || null;
}

/**
 * Fetch stories from the stories spreadsheet.
 * Tries static JSON first; falls back to the live Sheets API.
 * @returns {Promise<Array>} Array of story objects
 */
export async function fetchStoriesFromAPI() {
    // 1. Static pre-generated JSON
    try {
        const json = await fetchStaticJson(`${base}/data/sheets-stories.json`);
        if (json && json.stories) {
            return json.stories;
        }
    } catch { /* fall through */ }

    // 2. Live Google Sheets API
    const range = `'Sheet1'!A:Z`;
    try {
        const data = await fetchSheetValuesWithCache(STORIES_SPREADSHEET_ID, range);
        const rows = (data && data.values) || [];
        if (rows.length === 0) return [];
        // Normalize headers: lowercase, replace spaces AND hyphens with underscores
        const headers = rows[0].map(h => h.toLowerCase().replace(/[\s-]+/g, '_'));
        return rows.slice(1).map((row, index) => {
            const story = { id: index };
            headers.forEach((header, i) => {
                story[header] = row[i] || '';
            });
            return story;
        });
    } catch (error) {
        console.error('Error fetching stories data:', error);
        return [];
    }
}

/**
 * Get stories for a specific race
 * @param {string} raceId - Race ID (e.g., 'go-1', 'se-1', 'as-1', 'co-1')
 * @returns {Promise<Array>} Array of story objects for the race
 */
export async function getStoriesByRaceId(raceId) {
    const stories = await fetchStoriesFromAPI();
    const filteredStories = stories.filter(s => s.race_id === raceId);
    return filteredStories;
}

/**
 * Fetch all sheet names from the races spreadsheet.
 * Tries static JSON first; falls back to the live Sheets metadata API.
 * @returns {Promise<Array>} Array of sheet names
 */
export async function getAvailableSheets() {
    // 1. Static pre-generated JSON (sheet names = top-level keys)
    try {
        const json = await fetchStaticJson(`${base}/data/races.json`);
        if (json && json.sheets) {
            return Object.keys(json.sheets);
        }
    } catch { /* fall through */ }

    // 2. Live Sheets metadata API
    try {
        const data = await fetchSpreadsheetMetadataWithCache(RACES_SPREADSHEET_ID);
        const sheets = (data && data.sheets) || [];
        return sheets.map(sheet => sheet.properties.title);
    } catch (error) {
        console.error('Error fetching available sheets:', error);
        return [];
    }
}

/**
 * Get all statewide races (races without districts)
 * Filters out district-based races like Assembly, Senate, and US Congress
 * @returns {Promise<Array>} Array of statewide race objects
 */
export async function getStatewideRaces() {
    const allSheets = await getAvailableSheets();
    const districtRaces = ['Assembly', 'Senate', 'US Congress'];
    
    const statewideRaces = allSheets
        .filter(sheet => !districtRaces.includes(sheet))
        .map(sheet => ({
            value: sheet,
            label: sheet,
            hasDistricts: false,
            slug: sheet.toLowerCase().replace(/\s+/g, '-')
        }));
    
    return statewideRaces;
}

