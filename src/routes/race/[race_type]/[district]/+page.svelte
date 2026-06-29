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
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRaceByRaceId, getCandidateByCandidateId, getStoriesByRaceId, getPositionInfo } from '$lib/googleSheets.js';
    import { initializeSingleDistrictMap } from '$lib/mapUtils.js';
    import { saveSourceRace, clearSourceRace } from '$lib/raceStorage.js';
    
    export let data;
    
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
            displayName: 'Wisconsin Governor Democrat Primary',
            raceType: 'Governor',
            hasMap: false,
            urlPath: 'governor-democrat-primary'
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
    let loading = true;
    let error = null;
    let pymChild;
    let contentDiv;
    let districtMap = null;
    let config = null;
    let raceTypeParam = '';
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
            goto(`${base}/race/${configKey}/candidate/${candidateId}`);
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

            // Load up to 5 candidates, setting incumbent solely from the race sheet's
            // 'incumbent' column (contains the candidate_id, or empty if none).
            candidates = [];
            for (let i = 1; i <= 5; i++) {
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

            // Load stories for this race using the actual race-id
            stories = await getStoriesByRaceId(race['race-id']);
            
            // Load position information from the sheet level
            positionInfo = await getPositionInfo(config.raceType);
            console.log('Position info loaded:', positionInfo);
            
            loading = false;
        } catch (err) {
            error = err.message;
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
                    <button class="back-button" on:click={() => goto(`${base}/`)}>
                        <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home
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
                                            <img src="{base}/graphics/candidates/{candidate.candidate_id}.jpg" alt={candidate.name} class="candidate-photo" on:error={(e) => { e.target.src = `${base}/graphics/candidates/winner-who.png`; }} />
                                        {:else}
                                            <div class="candidate-placeholder">?</div>
                                        {/if}
                                        <div class="candidate-info">
                                            {#if candidate.incumbent === 'TRUE'}
                                                <p class="candidate-incumbent">INCUMBENT</p>
                                            {/if}
                                            {#if candidate.status === 'dropped-out'}
                                                <p class="candidate-incumbent">DROPPED OUT</p>
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

                    {#if race['ap-result']}
                        <div class="info-section ap-result-section">
                            {@html race['ap-result']}
                        </div>
                    {/if}

                    {#if race['district-info']}
                        <div class="info-section">
                            <h2>District Overview</h2>
                            <p>{race['district-info']}</p>
                        </div>
                    {/if}

                    {#if race['district-race-nutshell']}
                        <div class="info-section">
                            <h2>Race Overview</h2>
                            <p>{@html race['district-race-nutshell'].replace(/\n/g, '<br>')}</p>
                        </div>
                    {/if}

                    {#if race['primary-results']}
                        <div class="info-section">
                            <h2>Primary Results</h2>
                            <p>{race['primary-results']}</p>
                        </div>
                    {/if}

                    {#if positionInfo}
                        <div class="info-section">
                            <h2>What does this position do?</h2>
                            <p>{@html positionInfo.replace(/\n/g, '</p><p>')}</p>
                        </div>
                    {/if}
                    
                    {#if stories.length > 0}
                        <div class="info-section">
                            <h2>Stories about this race</h2>
                            <div class="stories-list">
                                {#each stories as story}
                                    <div class="story-item">
                                        <div class="story-data">
                                            <a href={story.url} target="_blank" rel="noopener noreferrer" class="story-headline">
                                                {story.headline}
                                            </a>
                                            {#if story.byline}
                                                <div class="story-byline">by <strong>{story.byline}</strong></div>
                                            {/if}
                                        </div>
                                        {#if story.cover_img}
                                            <img src={story.cover_img} alt={story.headline} class="story-cover-img" />
                                        {/if}
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
