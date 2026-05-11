<script>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';

    /** @type {string} - the race_type segment, e.g. 'governor', 'governor-republican-primary' */
    export let raceType;
    /** @type {string} - the district/race-id segment, e.g. '1', 'go-r', 'go-d' */
    export let raceId;

    onMount(() => {
        goto(`${base}/race/${raceType}/${raceId}`);
    });
</script>

<div class="loading-message">
    <p>Loading race...</p>
</div>
