// @ts-nocheck
import { base } from '$app/paths';

const FINANCE_DIRECTORY_URL = `${base}/data/finance_report/state/finance_directory.csv`;
const SCRAPE_REPORTS_BASE_URL = `${base}/data/finance_report/state/Scrape%20Reports`;

const reportTotalCache = new Map();
const reportDataCache = new Map();

/**
 * @typedef {Object} DirectoryEntry
 * @property {string} reportId
 * @property {string} entityId
 */

/** @type {Promise<Map<string, DirectoryEntry>> | null} */
let typedDirectoryMapPromise = null;

/**
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Escaped quote inside a quoted field.
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    result.push(current.trim());
    return result;
}

/**
 * @param {string} text
 * @returns {Array<Record<string, string>>}
 */
function parseCsv(text) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) {
        return [];
    }

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
        const columns = parseCsvLine(line);
        /** @type {Record<string, string>} */
        const row = {};

        headers.forEach((header, index) => {
            row[header] = columns[index] || '';
        });

        return row;
    });
}

async function loadDirectoryMap() {
    if (!typedDirectoryMapPromise) {
        typedDirectoryMapPromise = (async () => {
            const response = await fetch(FINANCE_DIRECTORY_URL);
            if (!response.ok) {
                throw new Error(`Failed to load finance directory: ${response.status}`);
            }

            const csvText = await response.text();
            const rows = parseCsv(csvText);
            /** @type {Map<string, DirectoryEntry>} */
            const directoryMap = new Map();

            rows.forEach((row) => {
                const candidateId = (row.candidate_id || '').trim();
                const reportId = (row.reportId1 || '').trim();
                const entityId = (row.entityId || '').trim();
                if (candidateId) {
                    directoryMap.set(candidateId, {
                        reportId,
                        entityId
                    });
                }
            });

            return directoryMap;
        })();
    }

    return typedDirectoryMapPromise;
}

/**
 * @param {any} data
 * @returns {number}
 */
function sumDonationsByCategory(data) {
    const categories = data?.donations_by_category?.result?.data?.json;
    if (!Array.isArray(categories)) {
        return 0;
    }

    return categories.reduce((sum, entry) => {
        const value = Number(entry?.total);
        return Number.isFinite(value) ? sum + value : sum;
    }, 0);
}

/**
 * @param {string} reportId
 * @returns {Promise<any | null>}
 */
async function getReportData(reportId) {
    if (!reportId) {
        return null;
    }

    if (reportDataCache.has(reportId)) {
        return reportDataCache.get(reportId);
    }

    try {
        const response = await fetch(`${SCRAPE_REPORTS_BASE_URL}/${reportId}.json`);
        if (!response.ok) {
            reportDataCache.set(reportId, null);
            return null;
        }

        const report = await response.json();
        reportDataCache.set(reportId, report);
        return report;
    } catch {
        reportDataCache.set(reportId, null);
        return null;
    }
}

/**
 * @param {string} candidateId
 * @returns {Promise<number>}
 */
export async function getFundsRaisedByCandidateId(candidateId) {
    if (!candidateId) {
        return 0;
    }

    const directoryMap = await loadDirectoryMap();
    const directoryEntry = directoryMap.get(candidateId);
    const reportId = directoryEntry?.reportId;

    if (!reportId) {
        return 0;
    }

    if (reportTotalCache.has(reportId)) {
        return reportTotalCache.get(reportId);
    }

    const report = await getReportData(reportId);
    if (!report) {
        reportTotalCache.set(reportId, 0);
        return 0;
    }

    const total = sumDonationsByCategory(report);
    reportTotalCache.set(reportId, total);
    return total;
}

/**
 * @param {string[]} candidateIds
 * @returns {Promise<Record<string, number>>}
 */
export async function getFundsRaisedForCandidates(candidateIds) {
    /** @type {Record<string, number>} */
    const totals = {};

    await Promise.all(
        candidateIds.map(async (candidateId) => {
            totals[candidateId] = await getFundsRaisedByCandidateId(candidateId);
        })
    );

    return totals;
}

/**
 * @param {string} candidateId
 * @returns {Promise<{entityId: string, donors: Array<{nameLabel: string, count: number, total: number}>}>}
 */
export async function getTopDonorsByCandidateId(candidateId) {
    if (!candidateId) {
        return {
            entityId: '',
            donors: []
        };
    }

    const directoryMap = await loadDirectoryMap();
    const directoryEntry = directoryMap.get(candidateId);
    const reportId = directoryEntry?.reportId;
    const entityId = directoryEntry?.entityId || '';

    if (!reportId) {
        return {
            entityId,
            donors: []
        };
    }

    const report = await getReportData(reportId);
    const rawDonors = report?.top_donors?.result?.data?.json;

    if (!Array.isArray(rawDonors)) {
        return {
            entityId,
            donors: []
        };
    }

    const donors = rawDonors
        .map((donor) => ({
            nameLabel: donor?.nameLabel || 'Unknown Donor',
            count: Number.isFinite(Number(donor?.count)) ? Number(donor.count) : 0,
            total: Number.isFinite(Number(donor?.total)) ? Number(donor.total) : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    return {
        entityId,
        donors
    };
}
