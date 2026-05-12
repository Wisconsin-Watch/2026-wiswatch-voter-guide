<script>
  export let status = 404;
  export let error = { message: 'Page Not Found' };
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>{status} – {error.message}</title>
</svelte:head>

<section class="error-page">
  <h1>{status}</h1>
  <h2>Uh! {error.message}!</h2>
      <div class="race-detail">
        <button class="back-button" on:click={() => goto(`${base}/`)}>
            <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home
        </button>      
    </div>
</section>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }
  .error-page h1 {
    font-size: 6rem;
    margin: 0;
    color: #b66353;
  }
  .error-page h2 {
    font-size: 2rem;
    margin: 0.5rem 0 1rem 0;
  }
</style>
