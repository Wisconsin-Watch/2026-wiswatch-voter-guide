<script>
	export let data;
</script>

<svelte:head>
	<title>All 2026 Wisconsin races | Wisconsin Watch voter guide</title>
	<meta name="description" content="Browse Wisconsin's 2026 elections by office and district in the Wisconsin Watch nonpartisan voter guide.">
	<link rel="canonical" href="https://wisconsin-watch.github.io/2026-wiswatch-voter-guide/races/">
</svelte:head>

<main class="directory">
	<h1>All 2026 Wisconsin races</h1>
	<p>Browse voter guides for statewide, congressional and legislative elections.</p>
	<ul>
		{#each data.races as race}
			<li><a href={race.href}>{race.name}</a></li>
		{/each}
	</ul>
</main>

<style>
	.directory { max-width: 900px; margin: 0 auto; padding: 3rem 1rem 5rem; }
	.directory ul { columns: 3 240px; padding-left: 1.25rem; }
	.directory li { break-inside: avoid; margin-bottom: 0.65rem; }
</style>
