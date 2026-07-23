<script>
    import { onDestroy, onMount } from 'svelte';

    export let donors = [];

    let rankingElement;
    let hasEnteredViewport = false;
    let viewportObserver;

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });

    $: rankedDonors = [...donors]
        .sort((a, b) => b.total - a.total || a.nameLabel.localeCompare(b.nameLabel));

    $: maxTotal = rankedDonors.length > 0 ? rankedDonors[0].total : 0;

    $: donorRows = rankedDonors.map((donor) => ({
        ...donor,
        widthPct: maxTotal > 0 ? (donor.total / maxTotal) * 100 : 0,
        amountInsideBar: maxTotal > 0 ? (donor.total / maxTotal) * 100 >= 25 : false,
        amountLabel: currencyFormatter.format(donor.total)
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

        if (rankingElement) {
            viewportObserver.observe(rankingElement);
        }
    });

    onDestroy(() => {
        if (viewportObserver) {
            viewportObserver.disconnect();
        }
    });
</script>

<div class="top-donors-list" class:in-view={hasEnteredViewport} bind:this={rankingElement}>
    {#each donorRows as donor}
        <div class="top-donors-row">
            <div class="top-donors-name-group">
                <div class="top-donors-name">{donor.nameLabel}</div>
                <div class="top-donors-count">Total transactions: {donor.count}</div>
            </div>
            <div class="top-donors-bar-track">
                <div
                    class={`top-donors-bar ${donor.amountInsideBar ? 'with-inside-label' : ''}`}
                    style={`width: ${donor.widthPct}%;`}
                    title={`${donor.nameLabel}: ${donor.amountLabel}`}
                >
                    <div class="top-donors-bar-fill"></div>
                    {#if donor.amountInsideBar}
                        <span class="top-donors-amount">{donor.amountLabel}</span>
                    {/if}
                </div>
                {#if !donor.amountInsideBar}
                    <span class="top-donors-amount top-donors-amount-outside">{donor.amountLabel}</span>
                {/if}
            </div>
        </div>
    {/each}
</div>
