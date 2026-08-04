// @ts-nocheck
import { base } from '$app/paths';

const SCRAPE_REPORTS_BASE_URL = `${base}/data/finance_report/state/Scrape%20Reports`;

const reportDataCache = new Map();

/**
 * Fetch the processed finance summary JSON for a candidate.
 * Files are named by candidate_id (e.g. a-phillips1.json).
 *
 * @param {string} candidateId
 * @returns {Promise<any | null>}
 */
async function getCandidateReport(candidateId) {
    if (!candidateId) {
        return null;
    }

    if (reportDataCache.has(candidateId)) {
        return reportDataCache.get(candidateId);
    }

    try {
        const response = await fetch(`${SCRAPE_REPORTS_BASE_URL}/${candidateId}.json`);
        if (!response.ok) {
            reportDataCache.set(candidateId, null);
            return null;
        }

        const report = await response.json();
        reportDataCache.set(candidateId, report);
        return report;
    } catch {
        reportDataCache.set(candidateId, null);
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

    const report = await getCandidateReport(candidateId);
    return Number(report?.contributions_received) || 0;
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
        return { entityId: '', donors: [] };
    }

    const report = await getCandidateReport(candidateId);
    const entityId = report?.entity_id || '';
    const rawDonors = report?.top_donors;

    if (!Array.isArray(rawDonors)) {
        return { entityId, donors: [] };
    }

    const donors = rawDonors
        .map((donor) => ({
            nameLabel: donor?.name || 'Unknown Donor',
            count: Number.isFinite(Number(donor?.count)) ? Number(donor.count) : 0,
            total: Number.isFinite(Number(donor?.total)) ? Number(donor.total) : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    return { entityId, donors };
}
