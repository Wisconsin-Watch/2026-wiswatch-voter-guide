<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    {#if config.hasMap}
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.15.0/dist/maplibre-gl.css">
    {/if}
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { onMount, onDestroy, tick } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRaceByRaceId, getCandidateByCandidateId, getStoriesByRaceId, getPositionInfo } from '$lib/googleSheets.js';
    import { getFundsRaisedForCandidates } from '$lib/financeReports.js';
    import FundsRaisedRanking from '$lib/FundsRaisedRanking.svelte';
    import { initializeSingleDistrictMap } from '$lib/mapUtils.js';
    import { saveSourceRace, clearSourceRace } from '$lib/raceStorage.js';
    
    export let data;

    //Ads
    onMount(async () => {
    await tick();
    await new Promise(requestAnimationFrame);

    const zones = document.querySelectorAll('broadstreet-zone');
    console.log('Broadstreet zones found:', [...zones].map(z => ({
        id: z.id,
        zoneId: z.getAttribute('zone-id')
    })));

    if (!window.__broadstreetWatched && window.broadstreet?.watch) {
        window.__broadstreetWatched = true;
        window.broadstreet.watch({ networkId: 9723 });
    }
    });
    
    // District-based race configurations (these have maps and happens every two years)
    const DISTRICT_RACE_CONFIG = {
        assembly: {
            displayName: 'Wisconsin State Assembly',
            raceType: 'Assembly',
            hasMap: true,
            pmtilesPath: `${base}/map-pmtiles/WI_Assembly_Districts_2026.pmtiles`,
            mapSourceLayer: 'ASM2024',
            urlPath: 'assembly'
        },
        congress: {
            displayName: 'U.S. House of Representatives',
            raceType: 'US Congress',
            hasMap: true,
            pmtilesPath: `${base}/map-pmtiles/WI_Congressional_Districts_2026.pmtiles`,
            mapSourceLayer: 'CON2021',
            urlPath: 'congress'
        },
        senate: {
            displayName: 'Wisconsin State Senate',
            raceType: 'Senate',
            hasMap: true,
            pmtilesPath: `${base}/map-pmtiles/WI_Senate_Districts_2026.pmtiles`,
            mapSourceLayer: 'SEN2024',
            urlPath: 'senate'
        }
    };
    
    // Statewide races that share a sheet but need distinct display names
    const STATEWIDE_RACE_CONFIG = {
        'governor-republican-primary': {
            displayName: 'Wisconsin Governor Republican Primary',
            raceType: 'Governor',
            hasMap: false,
            urlPath: 'governor-republican-primary'
        },
        'governor-democrat-primary': {
            displayName: 'Wisconsin Governor Democratic Primary',
            raceType: 'Governor',
            hasMap: false,
            urlPath: 'governor-democrat-primary'
        },
        'secretary-of-state': {
            displayName: 'Wisconsin Secretary of State Race',
            raceType: 'Secretary of State',
            hasMap: false,
            urlPath: 'secretary-of-state'
        }
    };

    /**
     * Generate configuration for a statewide race
     * @param {string} raceTypeSlug - URL slug like 'governor', 'attorney-general'
     * @returns {Object} Configuration object
     */
    function generateStatewideConfig(raceTypeSlug) {
        // Convert slug to proper case for display
        const displayName = raceTypeSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return {
            displayName: `Wisconsin ${displayName} Race`,
            raceType: displayName,
            hasMap: false,
            urlPath: raceTypeSlug
        };
    }
    
    let race = null;
    let candidates = [];
    let stories = [];
    let positionInfo = '';
    let fundsByCandidateId = {};
    let financeLoading = true;
    let loading = true;
    let error = null;
    let pymChild;
    let contentDiv;
    let districtMap = null;
    let config = null;
    let raceTypeParam = '';
    let showFundsRaisedSection = true;
    $: hasAnyFinanceData = Object.values(fundsByCandidateId).some(v => v > 0);
    let previousRaceType = '';
    let previousDistrict = '';
    
    // Get race configuration based on URL parameter
    $: {
        raceTypeParam = $page.params.race_type;
        
        // Check if it's a district-based race first
        if (DISTRICT_RACE_CONFIG[raceTypeParam]) {
            config = DISTRICT_RACE_CONFIG[raceTypeParam];
        } else if (STATEWIDE_RACE_CONFIG[raceTypeParam]) {
            // Check explicit statewide race config (e.g. primaries sharing a sheet)
            config = STATEWIDE_RACE_CONFIG[raceTypeParam];
        } else {
            // Assume it's a statewide race and generate config dynamically
            config = generateStatewideConfig(raceTypeParam);
        }

        showFundsRaisedSection = raceTypeParam !== 'congress';
    }

    function getRaceConfigKey(raceTypeSlug) {
        // Map known slugs to config keys
        if (raceTypeSlug.endsWith('governor')) return 'governor';
        if (raceTypeSlug.endsWith('senate')) return 'senate';
        if (raceTypeSlug.endsWith('assembly')) return 'assembly';
        if (raceTypeSlug.endsWith('congress')) return 'congress';
        // fallback: return original slug
        return raceTypeSlug;
    }
    
    function navigateToCandidate(candidateId) {
        if (race && config) {
            saveSourceRace(raceTypeParam, race['race-id']);
            const configKey = getRaceConfigKey(raceTypeParam);
            window.location.href = `${base}/race/${configKey}/candidate/${candidateId}`;
        }
    }
    
    async function loadRaceData() {
        try {
            if (!config) {
                error = 'Invalid race type';
                loading = false;
                return;
            }
            
            let raceId = $page.params.district;
            
            // For statewide races, we might need to find the actual race-id
            // Since we're passing '1' but the sheet might use 'go-1', 'ag-1', etc.
            if (!config.hasMap && raceId === '1') {
                // Fetch all races of this type and get the first one
                // We'll use the raceType from config to query the right sheet
                const races = await import('$lib/googleSheets.js').then(m => m.fetchRacesFromAPI(config.raceType));
                if (races && races.length > 0) {
                    // Use the first race's race-id
                    race = races[0];
                } else {
                    error = 'Race not found';
                    loading = false;
                    return;
                }
            } else {
                // For district races or if we have a specific race-id, use the normal flow
                race = await getRaceByRaceId(raceId, config.raceType);
            }
            
            if (!race) {
                error = 'Race not found';
                loading = false;
                return;
            }

            // Load up to 9 candidates, setting incumbent solely from the race sheet's
            // 'incumbent' column (contains the candidate_id, or empty if none).
            candidates = [];
            for (let i = 1; i <= 9; i++) {
                const candidateKey = `candidate-${i}`;
                const statusKey = `candidate-${i}-status`;
                if (race[candidateKey]) {
                    const candidate = await getCandidateByCandidateId(race[candidateKey], config.raceType);
                    if (candidate) {
                        const isIncumbent = race['incumbent'] && candidate.candidate_id === race['incumbent'];
                        candidates.push({
                            ...candidate,
                            incumbent: isIncumbent ? 'TRUE' : '',
                            status: race[statusKey] || ''
                        });
                    }
                }
            }

            // Sort candidates with active candidates first (a), inactive candidates last (b),
            // then alphabetically by last name within each group.
            candidates.sort((a, b) => {
                const getLastName = (name) => {
                    const parts = name.trim().split(/\s+/);
                    return parts[parts.length - 1].toLowerCase();
                };

                const isInactive = (candidate) => ['dropped-out', 'lost-primary'].includes(
                    (candidate.status || '').trim().toLowerCase()
                );

                const inactiveA = isInactive(a);
                const inactiveB = isInactive(b);

                // Active candidates come first.
                if (inactiveA !== inactiveB) {
                    return inactiveA ? 1 : -1;
                }

                const lastCompare = getLastName(a.name).localeCompare(getLastName(b.name));

                // If last names are the same, sort by full name
                return lastCompare || a.name.localeCompare(b.name);
            });

            if (showFundsRaisedSection) {
                // Load finance totals for candidates in this race.
                financeLoading = true;
                const candidateIds = candidates
                    .map((candidate) => candidate.candidate_id)
                    .filter(Boolean);
                fundsByCandidateId = await getFundsRaisedForCandidates(candidateIds);
                financeLoading = false;
            } else {
                financeLoading = false;
                fundsByCandidateId = {};
            }

            // Load stories for this race using the actual race-id
            stories = await getStoriesByRaceId(race['race-id']);
            
            // Load position information from the sheet level
            positionInfo = await getPositionInfo(config.raceType);
            
            loading = false;
        } catch (err) {
            error = err.message;
            financeLoading = false;
            loading = false;
            console.error('Error fetching race:', err);
        }
    }
    
    async function initializeDistrictMap() {
        if (!race || !config || !config.hasMap) return;
        
        districtMap = await initializeSingleDistrictMap(
            'district-map',
            config.pmtilesPath,
            config.mapSourceLayer,
            race['district-number']
        );
    }
    
    // Reactive statement to reload data when URL params change
    $: {
        const currentRaceType = $page.params.race_type;
        const currentDistrict = $page.params.district;
        
        // Only reload if parameters actually changed
        if (currentRaceType !== previousRaceType || currentDistrict !== previousDistrict) {
            previousRaceType = currentRaceType;
            previousDistrict = currentDistrict;
            
            // Clean up existing map before loading new data
            if (districtMap) {
                districtMap.remove();
                districtMap = null;
            }
            
            // Reset state
            loading = true;
            error = null;
            financeLoading = true;
            fundsByCandidateId = {};
            
            // Clear source race when arriving at race page
            clearSourceRace();
            
            loadRaceData().then(() => {
                // Initialize map after race data is loaded
                if (config && config.hasMap) {
                    setTimeout(initializeDistrictMap, 100);
                }
            });
        }
    }
    
    function handleIframeMessage(event) {
        // Handle height resize messages from embedded iframes (e.g. AP results)
        if (event.data && typeof event.data === 'object' && event.data.height) {
            const iframes = document.querySelectorAll('.ap-result-section iframe');
            iframes.forEach(iframe => {
                if (event.source === iframe.contentWindow) {
                    iframe.style.height = event.data.height + 'px';
                }
            });
        }
    }

    onMount(() => {
        // Initialize Pym.js for iframe embedding
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
        window.addEventListener('message', handleIframeMessage);

    });
    
    onDestroy(() => {
        window.removeEventListener('message', handleIframeMessage);
        if (districtMap) {
            districtMap.remove();
        }
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });
    
    $: if (pymChild && pymChild.sendHeight) {
        pymChild.sendHeight();
    }

</script>

<div id="content" class="site-content" bind:this={contentDiv}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
            {#if loading}
                <div class="loading-message">
                    <p>Loading race information...</p>
                </div>
            {:else if error}
                <div class="error-message">
                    <p>Error: {error}</p>
                </div>
            {:else if race && config}
                <div class="race-detail">
                    <button class="back-button" on:click={() => goto(`${base}/#address-map`)}>
                        <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />Home
                    </button>
                    
                    <div class="race-header">
                        <h1>{config.displayName}</h1>
                        {#if config.hasMap && race['district-number']}
                            <h2 class="district-number">District {race['district-number']}</h2>
                            <div id="district-map" class="district-map"></div>
                        {/if}
                    </div>
                    
                    {#if candidates.length > 0}
                        <div class="info-section">
                            <h2 data-tooltip="Candidates are sorted by last name.">Candidates</h2>
                            <div class="candidates-grid">
                                {#each candidates as candidate}
                                    <div class="candidate-card" role="button" tabindex="0" 
                                         on:click={() => navigateToCandidate(candidate.candidate_id)} 
                                         on:keydown={(e) => e.key === 'Enter' && navigateToCandidate(candidate.candidate_id)}>
                                        <div class="candidate-icon">
                                            <img src="{base}/graphics/plus.svg" alt="View details" />
                                        </div>
                                        {#if candidate.candidate_id}
                                            <img
                                                src="{base}/graphics/candidates/{candidate.candidate_id}.jpg"
                                                alt={candidate.name}
                                                class="candidate-photo"
                                                class:dropped-out={['dropped-out', 'lost-primary'].includes((candidate.status || '').trim().toLowerCase())}
                                                on:error={(e) => {
                                                    const img = e.currentTarget;

                                                    if (!img.dataset.triedUppercase) {
                                                    img.dataset.triedUppercase = "true";
                                                    img.src = `${base}/graphics/candidates/${candidate.candidate_id}.JPG`;
                                                    } else {
                                                    img.src = `${base}/graphics/candidates/winner-who.png`;
                                                    }
                                                }}
                                            />
                                        {:else}
                                            <div class="candidate-placeholder">?</div>
                                        {/if}
                                        <div class="candidate-info">
                                            {#if candidate.incumbent === 'TRUE'}
                                                <p class="candidate-incumbent">INCUMBENT</p>
                                            {/if}
                                            {#if (candidate.status || '').trim().toLowerCase() === 'dropped-out'}
                                                <p class="candidate-incumbent">DROPPED OUT</p>
                                            {:else if (candidate.status || '').trim().toLowerCase() === 'lost-primary'}
                                                <p class="candidate-incumbent">LOST PRIMARY</p>
                                            {/if}
                                            <p class="candidate-name">{candidate.name}</p>
                                            {#if candidate.party}
                                                <p class="candidate-party">{candidate.party}</p>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Voter Guide article pages -->
                    <broadstreet-zone zone-id="190810"></broadstreet-zone>

                    {#if race['ap-result']}
                        <div class="info-section ap-result-section">
                            <h2>Election Results</h2>
                            <div>{@html race['ap-result']}</div>
                        </div>
                    {/if}

                    {#if race['district-info']}
                        <div class="info-section">
                            <h2>District overview</h2>
                            <p>{race['district-info']}</p>
                        </div>
                    {/if}

                    {#if race['district-race-nutshell']}
                        <div class="info-section">
                            <h2>Race overview</h2>
                            <p>{@html race['district-race-nutshell'].replace(/\r?\n/g, '</p><p>')}</p>
                        </div>
                    {/if}

                        {#if showFundsRaisedSection && (financeLoading || hasAnyFinanceData)}
                            <div class="info-section funds-raised-section">
                                <h2>Campaign funds raised</h2>
                                {#if financeLoading}
                                    <p>Loading campaign finance data...</p>
                                {:else}
                                    <FundsRaisedRanking
                                        candidates={candidates}
                                        fundsByCandidateId={fundsByCandidateId}
                                    />
                                {/if}
                                <small>
                                    <i>Data reflects <strong>monetary</strong> and <strong>in-kind</strong> contributions reported to the <a href="https://campaignfinance.wi.gov/">Wisconsin Ethics Commission</a> with 2026 transaction dates. Personal loans are excluded. Data was retrieved on Aug. 4, 2026.</i>
                                </small>
                            </div>
                        {/if}

                    {#if race['primary-results']}
                        <div class="info-section">
                            <h2>Primary results</h2>
                            <p>{@html race['primary-results'].replace(/\r?\n/g, '</p><p>')}</p>
                        </div>
                    {/if}

                    {#if positionInfo}
                        <div class="info-section">
                            <h2>What does this position do?</h2>
                            <p>{@html positionInfo.replace(/\r?\n/g, '</p><p>')}</p>
                        </div>
                    {/if}
                    
                    {#if stories.length > 0}
                        <div class="info-section">
                            <h2>Stories about this race</h2>
                            <div class="stories-list">
                                {#each [...stories]
                                    .sort((a, b) => {
                                        // Featured stories always come first
                                        if (a.featured === "yes" && b.featured !== "yes") return -1;
                                        if (a.featured !== "yes" && b.featured === "yes") return 1;

                                        // Then sort by most recent publish date
                                        return (
                                            new Date(b.published_date).getTime() -
                                            new Date(a.published_date).getTime()
                                        );
                                    })
                                    .slice(0, 10) as story}
                                    <div class="story-item">
                                        <div class="story-data">
                                            <div class="story-meta">
                                                
                                                <a
                                                    href={story.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="story-headline"
                                                >
                                                    {story.headline}
                                                </a>

                                                {#if story.byline}
                                                    <div class="story-byline">
                                                        by <strong>{story.byline}</strong>
                                                    </div>
                                                {/if}

                                            </div>

                                            {#if story.featured_img}
                                                <div class="story-featured-img">
                                                    <img src={story.featured_img} alt={story.headline} />
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </main>
    </section>
</div>
