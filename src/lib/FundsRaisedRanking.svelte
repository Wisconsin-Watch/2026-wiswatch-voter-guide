<script>
    import { onMount, onDestroy } from 'svelte';

    export let candidates = [];
    export let fundsByCandidateId = {};

    let listElement;
    let hasEnteredViewport = false;
    let viewportObserver;

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });

    const partyClass = (party) => {
        switch ((party || '').toLowerCase()) {
            case 'democrat':
                return 'party-democrat';
            case 'republican':
                return 'party-republican';
            case 'independent':
                return 'party-independent';
            default:
                return 'party-other';
        }
    };

    $: rankedRows = [...candidates]
        .map((candidate) => ({
            candidateId: candidate.candidate_id,
            name: candidate.name,
            party: candidate.party,
            raised: Number(fundsByCandidateId[candidate.candidate_id] || 0)
        }))
        .sort((a, b) => b.raised - a.raised || a.name.localeCompare(b.name));

    $: maxRaised = rankedRows.length > 0 ? rankedRows[0].raised : 0;

    $: rankedRowsWithPct = rankedRows.map((row) => ({
        ...row,
        widthPct: maxRaised > 0 ? (row.raised / maxRaised) * 100 : 0,
        amountInsideBar: maxRaised > 0 ? (row.raised / maxRaised) * 100 >= 22 : false,
        amountLabel: currencyFormatter.format(row.raised)
    }));

    onMount(() => {
        if (typeof IntersectionObserver === 'undefined') {
            hasEnteredViewport = true;
            return;
        }

        viewportObserver = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry && entry.isIntersecting) {
                    hasEnteredViewport = true;
                    viewportObserver.disconnect();
                }
            },
            {
                threshold: 0.2
            }
        );

        if (listElement) {
            viewportObserver.observe(listElement);
        }
    });

    onDestroy(() => {
        if (viewportObserver) {
            viewportObserver.disconnect();
        }
    });
</script>

<div class="funds-raised-list" class:in-view={hasEnteredViewport} bind:this={listElement}>
    {#each rankedRowsWithPct as row}
        <div class="funds-raised-row">
            <div class="funds-raised-name">{row.name}</div>
            <div class="funds-raised-bar-track">
                <div
                    class={`funds-raised-bar ${partyClass(row.party)} ${row.amountInsideBar ? 'with-inside-label' : ''}`}
                    style={`width: ${row.widthPct}%;`}
                    title={`${row.name}: ${row.amountLabel}`}
                >
                    <div class="funds-raised-bar-fill"></div>
                    {#if row.amountInsideBar}
                        <span class="funds-raised-amount">{row.amountLabel}</span>
                    {/if}
                </div>
                {#if !row.amountInsideBar}
                    <span class="funds-raised-amount funds-raised-amount-outside">{row.amountLabel}</span>
                {/if}
            </div>
        </div>
    {/each}
</div>
