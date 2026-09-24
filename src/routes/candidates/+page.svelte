<script>
	export let data;
</script>

<svelte:head>
	<title>All 2026 Wisconsin candidates | Wisconsin Watch voter guide</title>
	<meta name="description" content="Browse candidates running in Wisconsin's 2026 elections and read their backgrounds and questionnaire responses.">
	<link rel="canonical" href="https://voterguide26.wisconsinwatch.org/candidates/">
</svelte:head>

<main class="directory">
	<h1>All 2026 Wisconsin candidates</h1>
	<p>Browse candidate profiles and questionnaire responses.</p>
	<ul>
		{#each data.candidates as candidate}
			<li>
				<a href={candidate.href}>{candidate.name}</a>{candidate.party ? ` — ${candidate.party}` : ''}
			</li>
		{/each}
	</ul>
</main>

<style>
	.directory { max-width: 1100px; margin: 0 auto; padding: 3rem 1rem 5rem; }
	.directory ul { columns: 3 280px; padding-left: 1.25rem; }
	.directory li { break-inside: avoid; margin-bottom: 0.65rem; }
</style>
