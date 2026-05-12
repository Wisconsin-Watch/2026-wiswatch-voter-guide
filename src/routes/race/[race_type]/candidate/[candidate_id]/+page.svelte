<svelte:head>
	<link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
	<link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    <link rel="stylesheet" href="{base}/css/candidate-page.css">
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { onMount, afterUpdate } from 'svelte';
    import { afterNavigate, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { getCandidateByCandidateId, fetchRacesFromAPI, getAvailableSheets } from '$lib/googleSheets.js';
    import { loadSourceRace, clearSourceRace } from '$lib/raceStorage.js';
    import CandidateDetail from '$lib/CandidateDetail.svelte';
    
    // Dynamic race type configuration
    // Pre-seed with known district race slugs so that URL params like 'congress'
    // (used by the district page) resolve correctly even though the sheet is
    // named 'US Congress' (which would otherwise slugify to 'us-congress').
    // Governor primary slugs are also pre-seeded because the Governor sheet
    // has no race-type-slug fields to build them dynamically.
    let dynamicRaceConfig = {
        assembly: { displayName: 'Wisconsin State Assembly', raceType: 'Assembly' },
        senate:   { displayName: 'Wisconsin State Senate',   raceType: 'Senate' },
        congress: { displayName: 'U.S. House of Representatives', raceType: 'US Congress' },
        governor: { displayName: 'Wisconsin Governor', raceType: 'Governor' },
        'governor-democrat-primary':  { displayName: 'Wisconsin Governor Democratic Primary', raceType: 'Governor' },
        'governor-republican-primary': { displayName: 'Wisconsin Governor Republican Primary', raceType: 'Governor' }
    };
    let config = null;
    let raceTypeParam = '';

    async function buildRaceConfig() {
        const sheetNames = await getAvailableSheets();
        // Build a mapping from slug (hyphenated) -> sheetName (original title)
        for (const sheetName of sheetNames) {
            try {
                const races = await fetchRacesFromAPI(sheetName);
                // Ensure we always have a mapping from the sheet title slug to the sheetName
                try {
                    const sheetSlug = sheetName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    if (!dynamicRaceConfig[sheetSlug]) {
                        dynamicRaceConfig[sheetSlug] = {
                            displayName: sheetName.replace(/\b\w/g, l => l.toUpperCase()),
                            raceType: sheetName
                        };
                    }
                } catch (e) {
                    // ignore slug mapping errors
                }
                races.forEach(r => {
                    // Headers in fetchRacesFromAPI are normalized to lowercase and spaces->underscores
                    // Support both hyphen and underscore variants for robustness
                    const rawVal = (r['race-type-slug'] || r['race-type'] || r['race_type_slug'] || r['race_type'] || '');
                    const raw = String(rawVal).toLowerCase();
                    if (!raw) return;
                    const slug = raw.replace(/\s+/g, '-');
                    if (!dynamicRaceConfig[slug]) {
                        const display = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        // store original sheetName as raceType so fetchRacesFromAPI can use it
                        dynamicRaceConfig[slug] = {
                            displayName: display,
                            raceType: sheetName
                        };
                    }
                });
            } catch (e) {
                // ignore fetch errors and continue to next sheet
                continue;
            }
        }
        // finished building dynamicRaceConfig
    }
    
    let candidate = null;
    let loading = true;
    let error = null;
    let raceId = null;
    let pymChild;
    let contentElement;

    // Build config on mount
    onMount(async () => {
        await buildRaceConfig();
        raceTypeParam = $page.params.race_type;
        config = dynamicRaceConfig[raceTypeParam];
        if (!config) {
            error = 'Invalid race type';
            loading = false;
        }
    });
    
    function returnToRace() {
        const sourceRace = loadSourceRace();
        if (sourceRace && sourceRace.raceType === raceTypeParam) {
            clearSourceRace();
            goto(`${base}/race/${raceTypeParam}/${sourceRace.raceId}`);
        } else if (raceId) {
            clearSourceRace();
            goto(`${base}/race/${raceTypeParam}/${raceId}`);
        } else {
            clearSourceRace();
            goto(`${base}/`);
        }
    }
    
    async function fetchCandidate() {
        try {
            if (!config) {
                error = 'Invalid race type';
                loading = false;
                return;
            }
            
            const candidateId = $page.params.candidate_id;
            candidate = await getCandidateByCandidateId(candidateId, config.raceType);
            
            // Find the race that contains this candidate
            if (candidateId) {
                const races = await fetchRacesFromAPI(config.raceType);
                const race = races.find(r => 
                    r['candidate-1'] === candidateId || 
                    r['candidate-2'] === candidateId ||
                    r['candidate-3'] === candidateId ||
                    r['candidate-4'] === candidateId ||
                    r['candidate-5'] === candidateId
                );
                if (race) {
                    raceId = race['race-id'];
                }
            }
            
            if (!candidate) {
                error = 'Candidate not found';
            }
            
            loading = false;
        } catch (e) {
            error = e.message;
            loading = false;
            console.error('Error fetching candidate:', e);
        }
    }
    
    onMount(async () => {
        await buildRaceConfig();
        raceTypeParam = $page.params.race_type.toLowerCase();
        config = dynamicRaceConfig[raceTypeParam];
        if (!config) {
            error = 'Invalid race type';
            loading = false;
            return;
        }

        // Try to load from session storage first
        const sourceRace = loadSourceRace();
        if (sourceRace && sourceRace.raceType === raceTypeParam) {
            raceId = sourceRace.raceId;
        }

        await fetchCandidate();

        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
    });
    
    afterUpdate(() => {
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });
    
    afterNavigate(() => {
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });
</script>

<div id="content" class="site-content" bind:this={contentElement}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
            <div class="candidate-detail">
                <CandidateDetail
                    candidate={candidate}
                    loading={loading}
                    error={error}
                    raceId={raceId}
                    base={base}
                    showReturnToRace={$page.params.race_type !== undefined}
                    returnToRace={returnToRace}
                />
            </div>
        </main>
    </section>
</div>
