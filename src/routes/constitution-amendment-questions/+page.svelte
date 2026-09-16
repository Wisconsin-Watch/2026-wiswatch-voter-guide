<svelte:head>
    <title>2026 Wisconsin constitutional amendment questions | Wisconsin Watch</title>
    <meta name="description" content="Read the 2026 Wisconsin constitutional amendment questions and nonpartisan voter information from Wisconsin Watch.">
    <link rel="canonical" href="https://wisconsin-watch.github.io/2026-wiswatch-voter-guide/constitution-amendment-questions/">
    <link rel="stylesheet" href="{base}/css/bento-grid.css">
        <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';

    let pymChild;

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
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
        window.addEventListener('message', handleIframeMessage);
    });

    onDestroy(() => {
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
                    <button class="back-button" on:click={() => goto(`${base}`)}>
                        <span class="button-interaction-layer" aria-hidden="true"></span>
                        <img src={`${base}/graphics/back.svg`} alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />Home
                    </button>

                    <div class="race-header"><h1>Constitution Amendment Questions</h1></div>

                    <div class="intro">

                        <div class="info-section ring bento-section" style="display: flex; flex-direction: row;">
                            <div class="bento-body">
                                <h2>What does a constitutional amendment do? </h2> 
                                <p>
                                    A constitutional amendment is a proposed change to the Wisconsin constitution that is approved or rejected by voters at the ballot box. Wisconsin voters see constitutional amendments after state lawmakers approve identical language during two consecutive legislative sessions.
                                </p>
                                <p> 
                                    Unlike a bill, the governor does not get a final say on a constitutional amendment. During Democratic Gov. Tony Evers’ two terms, Republican lawmakers have advanced their priorities through constitutional amendments to circumvent the governor’s veto pen.
                                </p>
                            </div>   
                            
                            <div class="bento-image-container" style="margin: auto; padding: 0 1rem">
                                <figure>
                                    <img srcset="https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2026/09/asse6518930.jpg?w=2048&quality=100&ssl=1" style="box-shadow: 0px 0px 5px 1px rgba(35, 49, 102, 0.4);"> 
                                    <figcaption><span>Gov. Tony Evers is photographed signing the Wisconsin 2023-25 biennial budget on July 5, 2023, in the Wisconsin State Capitol building in Madison, Wis. (Drake White-Bergey / Wisconsin Watch)</span></figcaption>
                                </figure>
                            </div>
                        </div>
                    </div>

                    <div class="info-section ring bento-section">
                        <div style="padding-top: 1rem;">
                            <h2>Question 1: </h2>                                
                            <p>
                                 <strong>Partial veto.</strong> Shall section 10 (1) (c) of article V of the constitution be amended to prohibit the governor, in exercising his or her partial veto authority, from creating or increasing or authorizing the creation or increase of any tax or fee?
                            </p>
                            <details>
                                <summary>
                                    <img src="{base}/graphics/simple-arrow.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />
                                    <h4>Overview:</h4>
                                </summary>
                                <p>
                                    This question seeks to change the state constitution limit when the governor can use his or her partial veto powers to create or raise taxes or fees. Republican lawmakers initiated this constitutional amendment after Democratic Gov. Tony Evers used his veto pen during the 2023-25 budget process to raise school revenue limits by $325 a year for the next 400 years. Republicans have incorrectly claimed that the 400-year veto raises property taxes.
                                </p>
                            </details>
                        </div>

                        <div style="padding-top: 1rem;">
                            <h2>Question 2: </h2>                                
                            <p>
                                <strong>Freedom to gather in places of worship during an emergency.</strong> Shall section 18 of article I of the constitution, which deals with religious liberty, be amended to prohibit the state or a political subdivision of the state from ordering the closure of, or forbidding gatherings in, places of worship in response to a state of emergency, including a public health emergency?
                            </p>
                            <details>
                                <summary>
                                    <img src="{base}/graphics/simple-arrow.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />
                                    <h4>Overview:</h4>
                                </summary>
                                <p>
                                    This question aims to change the state constitution to prevent the government from closing religious worship sites during emergencies, such as a future pandemic. During the COVID-19 pandemic, the Evers administration put guardrails on what businesses could open and gatherings could take place to curb the spread of the virus. This limited religious gatherings to fewer than 10 people. Republican lawmakers argued the government should not be able to close places of worship when Wisconsinites may need them most. Organizations, like the League of Women Voters of Wisconsin, who are opposed to the amendment said faith can be practiced anywhere during an emergency.
                                </p>
                            </details>
                        </div>

                        <div style="padding-top: 1rem;">
                            <h2>Question 3: </h2>                                
                            <p>
                                <strong>Governmental entity discrimination prohibited.</strong> Shall section 27 of article I of the constitution be created to prohibit governmental entities in the state from discriminating against, or granting preferential treatment to, any individual or group on the basis of race, sex, color, ethnicity, or national origin in public employment, public education, public contracting, or public administration?
                            </p>
                            <details>
                                <summary>
                                    <img src="{base}/graphics/simple-arrow.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />
                                    <h4>Overview:</h4>
                                </summary>
                                <p>
                                    This question would change the state constitution to prohibit discrimination by state and local governments and in public education from K-12 schools to colleges and universities. Supportive groups say the amendment would end diversity, equity and inclusion programs that conservatives view as discriminatory, while those who oppose the question argue it could limit opportunities for disadvantaged communities in Wisconsin.
                                </p>
                            </details>
                        </div>

                        <div class="calendar-actions">
                            <a class="calendar-link" style="text-align:center;" href="https://wisconsinwatch.org/2026/09/wisconsin-constitutional-amendments-election-ballot-governor-veto-power-religious-gatherings-dei/">More on amendment questions →</a>
                        </div>
                    </div>


            </div>

        </main>
    </section>
</div>

<style>
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

    .intro {
        align-items: flex-start;
        display: flex;
    }

    @media (max-width: 769px) {
        .intro > :first-child {
            flex-direction: column !important;
        }

        .bento-image-container {
            padding-top: 2rem !important;
        }
    }
</style>
