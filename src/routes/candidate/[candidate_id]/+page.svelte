<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    <link rel="stylesheet" href="{base}/css/candidate-page.css">
</svelte:head>

<script>
    console.log('=== CANDIDATE PAGE SCRIPT LOADED ===');
    
    import { base } from '$app/paths';
    import { onMount, afterUpdate } from 'svelte';
    import { afterNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import CandidateDetail from '$lib/CandidateDetail.svelte';
    import { getCandidateByCandidateId, fetchRacesFromAPI, getAvailableSheets } from '$lib/googleSheets.js';

    let dynamicRaceConfig = {};
    let config = null;
    let candidate = null;
    let loading = true;
    let error = null;
    let raceId = null;
    let pymChild;
    let contentElement;
    let questions = [];
    
    console.log('=== SCRIPT VARIABLES INITIALIZED ===');

    async function loadQuestions() {
        try {
            console.log('Starting to load questions from:', `${base}/data/candidate-questions.json`);
            const response = await fetch(`${base}/data/candidate-questions.json`);
            console.log('Fetch response:', response.status, response.ok);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            
            questions = await response.json();
            console.log('Loaded questions:', questions);
        } catch (e) {
            console.error('Error loading questions:', e);
        }
    }

    async function buildRaceConfig() {
        const sheetNames = await getAvailableSheets();
        for (const sheetName of sheetNames) {
            try {
                const races = await fetchRacesFromAPI(sheetName);
                try {
                    const sheetSlug = sheetName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    if (!dynamicRaceConfig[sheetSlug]) {
                        dynamicRaceConfig[sheetSlug] = { displayName: sheetName.replace(/\b\w/g, l => l.toUpperCase()), raceType: sheetName };
                    }
                } catch (e) {}
                races.forEach(r => {
                    const rawVal = (r['race-type-slug'] || r['race-type'] || r['race_type_slug'] || r['race_type'] || '');
                    const raw = String(rawVal).toLowerCase();
                    if (!raw) return;
                    const slug = raw.replace(/\s+/g, '-');
                    if (!dynamicRaceConfig[slug]) {
                        const display = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        dynamicRaceConfig[slug] = { displayName: display, raceType: sheetName };
                    }
                });
            } catch (e) { continue; }
        }
    }

    async function fetchCandidate() {
        try {
            const candidateId = $page.params.candidate_id;
            for (const slug of Object.keys(dynamicRaceConfig)) {
                const cfg = dynamicRaceConfig[slug];
                try {
                    const c = await getCandidateByCandidateId(candidateId, cfg.raceType);
                    if (c) {
                        candidate = c;
                        config = cfg;
                        const races = await fetchRacesFromAPI(cfg.raceType);
                        const race = races.find(r =>
                            r['candidate-1'] === candidateId ||
                            r['candidate-2'] === candidateId ||
                            r['candidate-3'] === candidateId ||
                            r['candidate-4'] === candidateId ||
                            r['candidate-5'] === candidateId
                        );
                        if (race) raceId = race['race-id'];
                        break;
                    }
                } catch (e) { continue; }
            }
            if (!candidate) error = 'Candidate not found';
            loading = false;
        } catch (e) {
            error = e.message;
            loading = false;
        }
    }

    onMount(async () => {
        try {
            await loadQuestions();
            await buildRaceConfig();
            await fetchCandidate();
            if (typeof window !== 'undefined' && window.pym) {
                pymChild = new window.pym.Child();
            }
        } catch (err) {
            console.error('=== onMount ERROR ===', err);
        }
    });

    afterUpdate(() => {
        if (pymChild && pymChild.sendHeight) pymChild.sendHeight();
    });

    afterNavigate(() => {
        if (pymChild && pymChild.sendHeight) pymChild.sendHeight();
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
                    showReturnToRace={false}
                    returnToRace={() => {}}
                    questions={questions}
                />
            </div>
        </main>
    </section>
</div>
