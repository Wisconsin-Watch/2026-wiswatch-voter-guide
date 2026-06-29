/**
 * Fetch all Google Sheets data and save to static JSON files.
 *
 * Outputs:
 *   static/data/candidates.json   — all rows from the Candidate tab
 *   static/data/races.json        — every tab from the races spreadsheet
 *   static/data/sheets-stories.json — story links from the stories spreadsheet
 *
 * Only writes a file when its data actually changed (ignores lastUpdated),
 * so unchanged sheets don't trigger a needless rebuild/deploy.
 *
 * Usage:
 *   VITE_GOOGLE_SHEETS_API_KEY=<key> node scripts/fetch-sheets.js
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Spreadsheet IDs (same as src/lib/googleSheets.js) ───────────────────────
const SPREADSHEET_ID        = '1H2tgXpnn7kt8KxvPkLSELsU5ohYFM0p2tvBQJi5M44E';
const RACES_SPREADSHEET_ID  = '1XecLv5Q-ZFr-5ijvhHqEiVbX6MPl61jJDmiS4GuG-SY';
const STORIES_SPREADSHEET_ID = '19-BcTq-ueiZgxwCjEgTbxPSL2LBLyhjJAYmXQn3Bk-E';

const API_KEY =
  process.env.GOOGLE_SHEETS_API_KEY ||
  process.env.VITE_GOOGLE_SHEETS_API_KEY;

const DATA_DIR = resolve(__dirname, '../static/data');

// ── Sheets API helpers ───────────────────────────────────────────────────────

async function fetchSheetValues(spreadsheetId, range) {
  const encodedRange = encodeURIComponent(range);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    `/values/${encodedRange}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sheets API error ${res.status} for range "${range}": ${body}`);
  }
  return res.json();
}

async function fetchSpreadsheetMetadata(spreadsheetId) {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sheets API error ${res.status} for metadata: ${body}`);
  }
  return res.json();
}

// ── Row → object conversion ──────────────────────────────────────────────────

/**
 * Convert a 2-D array of sheet values to an array of plain objects.
 * @param {string[][]} rows - Raw values from the Sheets API (first row = headers).
 * @param {boolean} replaceHyphens - When true, hyphens in header names are also
 *   replaced with underscores (used for the stories sheet to match the live-API
 *   behaviour in googleSheets.js). Defaults to false so that hyphenated column
 *   names like "race-id" and "district-number" are preserved exactly as the rest
 *   of the codebase expects them.
 */
function rowsToObjects(rows, replaceHyphens = false) {
  if (!rows || rows.length === 0) return [];
  const pattern = replaceHyphens ? /[\s-]+/g : /\s+/g;
  const headers = rows[0].map(h => h.toLowerCase().replace(pattern, '_'));
  return rows.slice(1).map((row, index) => {
    const obj = { id: index };
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
}

// ── File write (only when data changed) ─────────────────────────────────────

/**
 * Serialise `payload` and write it only when the data portion differs from
 * what is already on disk (lastUpdated is intentionally ignored in the diff).
 * Returns true if the file was written, false if skipped.
 */
function saveIfChanged(filePath, payload) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Strip lastUpdated before comparing so a timestamp change alone never
  // triggers a commit.
  const dataOnly = ({ lastUpdated: _ts, ...rest }) => rest;

  if (existsSync(filePath)) {
    try {
      const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (
        JSON.stringify(dataOnly(existing)) ===
        JSON.stringify(dataOnly(payload))
      ) {
        console.log(`  no changes — skipping ${filePath}`);
        return false;
      }
    } catch {
      // corrupt file — overwrite
    }
  }

  writeFileSync(filePath, JSON.stringify(payload, null, 2));
  console.log(`  updated ${filePath}`);
  return true;
}

// ── Per-sheet fetchers ───────────────────────────────────────────────────────

async function fetchCandidates() {
  console.log('Fetching candidates…');
  const data = await fetchSheetValues(SPREADSHEET_ID, "'Candidate'!A:AY");
  return rowsToObjects((data && data.values) || []);
}

async function fetchAllRaces() {
  console.log('Fetching race sheets…');
  const metadata = await fetchSpreadsheetMetadata(RACES_SPREADSHEET_ID);
  const sheetNames = (metadata.sheets || []).map(s => s.properties.title);

  const sheets = {};
  for (const name of sheetNames) {
    console.log(`  → ${name}`);
    const data = await fetchSheetValues(RACES_SPREADSHEET_ID, `'${name}'!A:Z`);
    sheets[name] = rowsToObjects((data && data.values) || []);
  }
  return sheets;
}

async function fetchSheetsStories() {
  console.log('Fetching stories from Google Sheets…');
  const data = await fetchSheetValues(STORIES_SPREADSHEET_ID, "'Sheet1'!A:Z");
  return rowsToObjects((data && data.values) || [], true); // replaceHyphens=true matches googleSheets.js behaviour
}

// ── Position Info ────────────────────────────────────────────────────────────

/**
 * Load position-info.json and return a map of position-name to information.
 */
function loadPositionInfo() {
  const positionInfoPath = resolve(__dirname, '../static/data/position-info.json');
  if (!existsSync(positionInfoPath)) {
    console.warn('Warning: position-info.json not found');
    return {};
  }
  const data = JSON.parse(readFileSync(positionInfoPath, 'utf-8'));
  const map = {};
  for (const item of data) {
    map[item['position-name']] = item.information || '';
  }
  return map;
}

/**
 * Transform sheets object to include position information.
 * Changes structure from { "Assembly": [...] } to { "Assembly": { information: "...", races: [...] } }
 */
function addPositionInfoToSheets(sheets) {
  const positionInfo = loadPositionInfo();
  const transformed = {};
  
  // Map sheet names to position-info names
  const nameMap = {
    'US Congress': 'Congress',
    'Assembly': 'Assembly',
    'Senate': 'Senate',
    'Governor': 'Governor',
    'Attorney General': 'AttorneyGeneral',
    'Lieutenant Gov': 'LieutenantGov',
    'Treasurer': 'Treasurer',
    'Secretary of State': 'SecretaryofState'
  };
  
  for (const [sheetName, races] of Object.entries(sheets)) {
    const positionName = nameMap[sheetName] || sheetName;
    transformed[sheetName] = {
      information: positionInfo[positionName] || '',
      races: races
    };
  }
  
  return transformed;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error(
      'Error: GOOGLE_SHEETS_API_KEY (or VITE_GOOGLE_SHEETS_API_KEY) ' +
      'environment variable is not set.'
    );
    process.exit(1);
  }

  const now = new Date().toISOString();
  let anyChanged = false;

  // Candidates
  const candidates = await fetchCandidates();
  if (saveIfChanged(`${DATA_DIR}/candidates.json`, { lastUpdated: now, candidates })) {
    anyChanged = true;
  }

  // Races (all tabs)
  const sheets = await fetchAllRaces();
  const sheetsWithInfo = addPositionInfoToSheets(sheets);
  if (saveIfChanged(`${DATA_DIR}/races.json`, { lastUpdated: now, sheets: sheetsWithInfo })) {
    anyChanged = true;
  }

  // Stories from Google Sheets
  const stories = await fetchSheetsStories();
  if (saveIfChanged(`${DATA_DIR}/sheets-stories.json`, { lastUpdated: now, stories })) {
    anyChanged = true;
  }

  if (anyChanged) {
    console.log('\nDone — data files updated.');
  } else {
    console.log('\nDone — no data changed, nothing to commit.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
