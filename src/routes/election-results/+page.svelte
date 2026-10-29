<svelte:head>
    <title>2026 Wisconsin all election results | Wisconsin Watch</title>
    <meta name="description" content="Read the 2026 Wisconsin all election results from AP.">
    <link rel="canonical" href="https://voterguide26.wisconsinwatch.org/election-results/">
    <link rel="stylesheet" href="{base}/css/bento-grid.css">
        <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';
    import { getRaceByRaceId } from '$lib/googleSheets.js';
    import { loadRacesFromLocalStorage } from '$lib/raceStorage.js';

    let pymChild;
    let siteHeaderObserver;
    let siteHeaderHeight = 0;
    let savedRaces = null;
    let ballotRaces = [];

    const districtRaceTypes = [
        { key: 'assembly', sheetName: 'Assembly', label: 'State Assembly' },
        { key: 'senate', sheetName: 'Senate', label: 'State Senate' },
        { key: 'congress', sheetName: 'US Congress', label: 'U.S. House' }
    ];

    async function loadBallotRaces() {
        savedRaces = loadRacesFromLocalStorage();
        if (!savedRaces) return;

        const savedDistrictTypes = districtRaceTypes.filter(({ key }) => savedRaces[key]);
        if (savedDistrictTypes.length === 0) {
            savedRaces = null;
            return;
        }

        const races = await Promise.all(
            savedDistrictTypes.map(async ({ key, sheetName, label }) => {
                const race = await getRaceByRaceId(savedRaces[key], sheetName);
                if (!race) return null;

                return {
                    key,
                    districtName: `${label} District ${race['district-number']}`,
                    apResult: race['ap-result'] || ''
                };
            })
        );

        ballotRaces = races.filter(Boolean);
    }

    function handleIframeMessage(event) {
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
        const siteHeader = document.getElementById('masthead');
        if (siteHeader) {
            const updateSiteHeaderHeight = () => {
                siteHeaderHeight = siteHeader.getBoundingClientRect().height;
            };
            updateSiteHeaderHeight();
            siteHeaderObserver = new ResizeObserver(updateSiteHeaderHeight);
            siteHeaderObserver.observe(siteHeader);
        }

        loadBallotRaces().catch((error) => {
            console.error('Unable to load saved ballot races:', error);
            ballotRaces = [];
        });

        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
        window.addEventListener('message', handleIframeMessage);
    });

    onDestroy(() => {
        siteHeaderObserver?.disconnect();
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', handleIframeMessage);
        }
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });

    $: if (pymChild && pymChild.sendHeight) {
        pymChild.sendHeight();
    }
</script>

<div id="content" class="primary site-content">
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
            <div class="race-detail">
                    <button class="back-button" on:click={() => goto(`${base}/`)}>
                        <span class="button-interaction-layer" aria-hidden="true"></span>
                        <img src={`${base}/graphics/back.svg`} alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />Home
                    </button>

                    <div class="race-header results-header">
                        <p class="results-kicker">Wisconsin 2026</p>
                        <h1>Election Results <img src={`${base}/graphics/checkbox.svg`} alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /></h1>
                    </div>

                    <nav class="results-jump-nav" aria-label="Election results sections" style:top={`${siteHeaderHeight}px`}>
                        <span class="results-jump-label">Jump to:</span>
                        <div class="results-jump-links">
                            {#if savedRaces}
                                <a href="#your-ballot-results">Your ballot</a>
                            {/if}
                            <a href="#statewide-results">Statewide results</a>
                            <a href="#more-results">Local results</a>
                        </div>
                    </nav>

                    {#if savedRaces}
                    <div id="your-ballot-results" class="info-section ring bento-section ap-result-section">
                            <h2>Races on your ballot</h2>
                            {#each ballotRaces as ballotRace (ballotRace.key)}
                                <div class="ballot-race">
                                <h3>{ballotRace.districtName}</h3>
                                {#if ballotRace.apResult}
                                    <div class="ballot-race-result">{@html ballotRace.apResult}</div>
                                {:else}
                                    <p><i>No election results are available for this district.</i></p>
                                {/if}
                                </div>
                            {/each}
                    </div>
                    {/if}

                    <section id="statewide-results" class="results-group" aria-labelledby="statewide-results-heading">
                        <div class="results-group-heading">
                            <h2 id="statewide-results-heading">Statewide results</h2>
                        </div>

                    <div class="info-section ring bento-section ap-result-section">
                            <h2>Governor's race</h2>
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/37546.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                    </div>

                    <div class="info-section ring bento-section ap-result-section">
                            <h2>Statewide races</h2>
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/38090.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                    </div>

                    <div class="info-section ring bento-section ap-result-section">
                            <h2>Constitutional Amendments</h2>
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/38112.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                    </div>
                    </section>

                    <section id="more-results" class="results-group more-results" aria-labelledby="more-results-heading">
                        <div class="results-group-heading">
                            <p class="results-kicker">Explore more</p>
                            <h2 id="more-results-heading">More Wisconsin results</h2>
                        </div>
                    
                    <div class="info-section ring bento-section ap-result-section">
                            <h2>Key races by Wisconsin Watch</h2>
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/38108.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                    </div>

                    <div class="reference-results" aria-label="Complete results by office">
                        <details class="reference-result ap-result-section">
                            <summary>
                                <span>
                                    <h2>U.S. House races</h2>
                                </span>
                                <span class="reference-result-icon" aria-hidden="true"></span>
                            </summary>
                            <div class="reference-result-content">
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/38085.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                            <small><i>Click on arrow to expand or collapse results.</i></small>
                            </div>
                        </details>

                        <details class="reference-result ap-result-section">
                            <summary>
                                <span>
                                    <h2>State Senate races</h2>
                                </span>
                                <span class="reference-result-icon" aria-hidden="true"></span>
                            </summary>
                            <div class="reference-result-content">
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/38083.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                            <small><i>Click on arrow to expand or collapse results.</i></small>
                            </div>
                        </details>

                        <details class="reference-result ap-result-section">
                            <summary>
                                <span>
                                    <h2>State Assembly races</h2>
                                </span>
                                <span class="reference-result-icon" aria-hidden="true"></span>
                            </summary>
                            <div class="reference-result-content">
                            <iframe class="ap-embed" loading="lazy" title="Live election results via the Associated Press" src="https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/120503/38073.html" width="100%" frameborder="0" scrolling="no" marginheight="0"></iframe><script defer src="https://interactives.apelections.org/election-results/assets/microsite/resizeClient.js"></script>
                            <small><i>Click on arrow to expand or collapse results.</i></small>
                            </div>
                        </details>
                    </div>
                    </section>

            </div>

        </main>
    </section>
</div>

<style>

    :global(html) {
        scroll-behavior: smooth;
    }

    .results-header {
        max-width: 740px;
        margin-bottom: 1.5rem;
        margin-left: auto;
        margin-right: auto;
    }

    .results-header h1 {
        margin-bottom: 0.5rem;
    }

    .results-kicker {
        margin: 0 0 0.25rem;
        color: #0073aa;
        font-family: 'Heebo', sans-serif;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .results-intro,
    .results-group-heading > p:last-child {
        max-width: 680px;
        margin-top: 0;
        color: #515151;
        line-height: 1.55;
    }

    .results-jump-nav {
        position: sticky;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 2rem;
        padding: 0.7rem 0.8rem;
        border: rgba(35, 49, 102, 0.4) 0.5px solid;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 0 5px 1px #23316666;
        backdrop-filter: blur(10px);
    }

    .results-jump-label {
        flex: 0 0 auto;
        color: #515151;
        font-weight: 800;
    }

    .results-jump-links {
        display: grid;
        flex: 1;
        grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
        gap: 0.45rem;
        margin: auto;
    }

    .results-jump-links a {
        padding: 0.45rem;
        border-radius: 999px;
        background: #f3f6fa;
        color: #233166;
        font-family: 'Heebo', sans-serif;
        font-weight: 400;
        text-align: center;
        text-decoration: none;
        transition: background 200ms ease, text-decoration 200ms ease;
    }

    .results-jump-links a:hover,
    .results-jump-links a:focus-visible {
        background: #d5e2ee;
        text-decoration: underline;
    }

    #your-ballot-results,
    .results-group {
        scroll-margin-top: 6rem;
    }

    .results-group {
        margin-top: 2rem;
    }

    .results-group-heading {
        margin-bottom: 1.25rem;
        padding-left: 0.25rem;
    }

    .results-group-heading h2 {
        margin: 0 0 0.4rem;
        font-size: clamp(1.75rem, 4vw, 2.4rem);
    }

    .reference-results {
        display: grid;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    .reference-result {
        padding: 0;
        background: #fff;
        box-shadow: inset 0px 0px 5px 1px rgba(35, 49, 102, 0.4);
        border: rgba(35, 49, 102, 0.4) 0.5px solid;
        border-radius: 50px;
        overflow: clip;
    }

    .reference-result summary {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.1rem;
        border: 0;
        list-style: none;
    }

    .reference-result summary::-webkit-details-marker {
        display: none;
    }

    .reference-result summary > span:first-child {
        display: grid;
        gap: 0.15rem;
    }

    .reference-result summary strong {
        color: #233166;
        font-family: 'Publico Banner', 'Georgia', serif;
        font-size: 1.25rem;
    }

    .reference-result summary small {
        color: #515151;
        font-family: 'Heebo', sans-serif;
    }

    .reference-result-icon {
        position: relative;
        display: block;
        flex: 0 0 2rem;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: #f3f6fa;
        color: #233166;
        transition: transform 200ms ease, background 200ms ease;
    }

    .reference-result-icon::before,
    .reference-result-icon::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0.8rem;
        height: 5px;
        background: currentColor;
        transform: translate(-50%, -50%);
    }

    .reference-result-icon::after {
        transform: translate(-50%, -50%) rotate(90deg);
    }

    .reference-result[open] .reference-result-icon {
        background: #d5e2ee;
        transform: rotate(45deg);
    }

    .reference-result-content {
        padding: 1rem;
        border-top: 1px solid #d5e2ee;
    }

    .ballot-race {
        margin-bottom: 1rem;
        border-bottom: rgba(35, 49, 102, 0.4) 0.5px solid;
    }

    .calendar-actions {
        font-family: 'Heebo', sans-serif;
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.5rem;
        flex-wrap: wrap;

        font-weight: 600;
        background: none;
        border: none;
        padding: 0.4rem 0.6rem;
        cursor: pointer;
    }



    @media (max-width: 769px) {

        .results-jump-nav {
            align-items: flex-start;
            flex-direction: column;
        }

        .results-jump-links {
            width: 100%;
        }

        .bento-image-container {
            padding-top: 2rem !important;
        }
    }
</style>
