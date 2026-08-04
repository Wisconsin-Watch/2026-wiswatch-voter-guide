<script>
  import { goto } from '$app/navigation';
  import { getTopDonorsByCandidateId } from '$lib/financeReports.js';
  import TopDonorsRanking from '$lib/TopDonorsRanking.svelte';
  export let candidate = null;
  export let loading = true;
  export let error = null;
  export let raceId = null;
  export let base = '';
  export let showReturnToRace = true;
  export let returnToRace = () => {};
  export let questions = [];

  let topDonors = [];
  let topDonorsLoading = false;
  let campaignFinanceUrl = '';
  let currentTopDonorCandidateId = '';

  // Get questions and answers for the candidate
  $: candidateQuestionsAndAnswers = questions
    .map(q => ({
      question_id: q.question_id,
      question_text: q.question_text,
      answer: candidate?.[q.question_id]
    }))
    .filter(qa => qa.answer && qa.answer.trim() !== '');
  
  // Debug logging
  $: if (candidate && questions.length > 0) {
    console.log('Candidate loaded:', candidate.name);
    console.log('Questions available:', questions.length);
    console.log('Matched Q&A:', candidateQuestionsAndAnswers.length);
    console.log('Q&A details:', candidateQuestionsAndAnswers);
  }

      //Ads
      import {onMount, tick} from 'svelte';
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

  async function loadTopDonors(candidateId) {
    if (!candidateId) {
      topDonors = [];
      campaignFinanceUrl = '';
      currentTopDonorCandidateId = '';
      return;
    }

    currentTopDonorCandidateId = candidateId;
    topDonorsLoading = true;

    try {
      const result = await getTopDonorsByCandidateId(candidateId);

      if (currentTopDonorCandidateId !== candidateId) {
        return;
      }

      topDonors = result.donors;
      campaignFinanceUrl = result.entityId
        ? `https://campaignfinance.wi.gov/browse-data/registrant/${result.entityId}`
        : '';
    } catch {
      if (currentTopDonorCandidateId === candidateId) {
        topDonors = [];
        campaignFinanceUrl = '';
      }
    } finally {
      if (currentTopDonorCandidateId === candidateId) {
        topDonorsLoading = false;
      }
    }
  }

  $: if (candidate?.candidate_id && !loading && !error) {
    loadTopDonors(candidate.candidate_id);
  }

  $: if (!candidate?.candidate_id || loading || error) {
    topDonorsLoading = false;
    topDonors = [];
    campaignFinanceUrl = '';
    currentTopDonorCandidateId = '';
  }
</script>

{#if showReturnToRace && raceId}
  <button class="back-button" on:click={returnToRace}>
    <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />This Race
  </button>
{/if}
<button class="back-button" on:click={() => goto(`${base}/#address-map`)}>
  <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" />Home
</button>

{#if loading}
  <div class="loading-candidate-box" style="text-align: center; padding: 2rem;">
    <p>Loading candidate information...</p>
  </div>
{:else if error}
  <div class="loading-candidate-box" style="text-align: center; padding: 2rem; color: red;">
    <p>Error: {error}</p>
  </div>
{:else if candidate}
  <div class="candidate-header">
    <div class="candidate-photo">
      {#if candidate.candidate_id}
        <img 
          src="{base}/graphics/candidates/{candidate.candidate_id}.jpg"
          alt={candidate.name}
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
        <div class="placeholder-image">?</div>
      {/if}
    </div>
    
    <div class="candidate-basic-info">
      <h1>{candidate.name}</h1>
      {#if candidate.occupation}
        <p style="font-size: 1.2rem; margin: 0.5rem 0;">{candidate.occupation}</p>
      {/if}
      <div class="contact-inline" style="margin-top:0.75rem;">
        <div class="contact-icons">
        {#if candidate.party === 'Democrat'}
          <p style="margin: 0.5rem 0; color: #003cb9; display:flex; align-items:center;">
            <img src={base + '/graphics/logos/dem.svg'} alt="Democrat" style="height:1.5em; margin-right:0.5rem; vertical-align:-0.125em" loading="lazy" />
            <span style="font-weight: 600;">Democrat</span>
          </p>
        {:else if candidate.party === 'Republican'}
          <p style="margin: 0.5rem 0; color: #e9141e; display:flex; align-items:center;">
            <img src={base + '/graphics/logos/rep.svg'} alt="Republican" style="height:1.5em; margin-right:0.5rem; vertical-align:-0.125em" loading="lazy" />
            <span style="font-weight: 600;">Republican</span>
          </p>
        {:else if candidate.party === 'Independent'}
          <p style="margin: 0.5rem 0; color: #e69f00; display:flex; align-items:center;">
            <span style="font-weight: 600;">Independent</span>
          </p>
        {:else}
          <p style="font-weight: 600; margin: 0.5rem 0; color: #515151;">{candidate.party}</p>
        {/if}
        </div>
        {#if candidate.municipality}
          <div class="contact-icons hover-tooltip" data-tooltip="Residence" style="font-size:0.95rem;margin-bottom:0.25rem">
            <img src={base + '/graphics/location.svg'} alt="Residence" style="height:1.5em;vertical-align:middle;margin-right:0.5rem" loading="lazy" />
            {candidate.municipality}
          </div>
        {/if}
        {#if candidate.age}
          <div class="contact-icons hover-tooltip" data-tooltip="Age as of Election Day" style="font-size:0.95rem;margin-bottom:0.25rem">
            <strong>Age:</strong> {candidate.age}
          </div>
        {/if}
        <div class="contact-icons" style="margin-top:1.5rem">
          {#if candidate.website}
            <a class="hover-tooltip" data-tooltip="Website" href={candidate.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
              <img src={base + '/graphics/hyperlink.svg'} alt="Website" loading="lazy" />
            </a>
          {/if}
          {#if candidate.facebook}
            <a class="hover-tooltip" data-tooltip="Facebook" href={candidate.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={base + '/graphics/logos/facebook.svg'} alt="Facebook" loading="lazy" />
            </a>
          {/if}

          {#if candidate.twitter}
            <a class="hover-tooltip" data-tooltip="Twitter" href={candidate.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <img src={base + '/graphics/logos/x.svg'} alt="Twitter" loading="lazy" />
            </a>
          {/if}
          {#if candidate.instagram}
            <a class="hover-tooltip" data-tooltip="Instagram" href={candidate.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src={base + '/graphics/logos/instagram.svg'} alt="Instagram" loading="lazy" />
            </a>
          {/if}
          {#if candidate.youtube}
            <a class="hover-tooltip" data-tooltip="YouTube" href={candidate.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <img src={base + '/graphics/logos/youtube.svg'} alt="YouTube" loading="lazy" />
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Homepage -->
  <broadstreet-zone zone-id="190811"></broadstreet-zone>

  {#if candidate.elected_experience}
    <div class="info-section">
      <h2>Elected Experience</h2>
      <p>{candidate.elected_experience}</p>
    </div>
  {/if}

  {#if candidateQuestionsAndAnswers.length > 0}
    <div class="info-section">
      <h2>Q&A with the Candidate</h2>
      {#each candidateQuestionsAndAnswers as qa}
        <div class="qa-item" style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
            {qa.question_text}
          </h3>
          <p style="margin: 0; line-height: 1.6; color: #555;">
            {@html qa.answer.replace(/\n/g, '</p><p>')}
          </p>
        </div>
      {/each}
    </div>
  {/if}

  {#if candidate.interview_video}
    <div class="info-section" id="candidate-interview">
      <h2>Candidate Interview</h2>
        {@html candidate.interview_video}
    </div>
  {/if}

  {#if topDonors.length > 0}
  <div class="info-section">
    <h2>Top ten donors</h2>
      <TopDonorsRanking donors={topDonors} />
    {#if campaignFinanceUrl}
      <small class="top-donors-note">
        <span class="top-donors-note-icon" aria-hidden="true">!</span>
        <i>Click <a href={campaignFinanceUrl} target="_blank" rel="noopener noreferrer">here</a> for full campaign finance records. Data last updated on Aug. 4, 2026.</i>
      </small>
    {/if}
  </div>
  {/if}

{/if}
