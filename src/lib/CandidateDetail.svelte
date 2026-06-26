<script>
  import { goto } from '$app/navigation';
  export let candidate = null;
  export let loading = true;
  export let error = null;
  export let raceId = null;
  export let base = '';
  export let showReturnToRace = true;
  export let returnToRace = () => {};
  export let questions = [];

  // Get questions and answers for the candidate
  $: candidateQuestionsAndAnswers = questions
    .map(q => ({
      question_id: q.question_id,
      question_text: q.question_text,
      answer: candidate?.[q.question_id]
    }))
    .filter(qa => qa.answer && qa.answer.trim() !== '');
</script>

{#if showReturnToRace && raceId}
  <button class="back-button" on:click={returnToRace}>
    <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> This Race
  </button>
{/if}
<button class="back-button" on:click={() => goto(`${base}/`)}>
  <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home
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
          on:error={(e) => { e.target.src = `${base}/graphics/candidates/winner-who.png`; }}
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
        {#if candidate.phone_number}
          <div class="contact-icons hover-tooltip" data-tooltip="Phone Number" style="font-size:0.95rem;margin-bottom:0.25rem">
            <img src={base + '/graphics/phone.svg'} alt="Phone Number" style="height:1.5em;vertical-align:middle;margin-right:0.5rem" loading="lazy" />
            {candidate.phone_number}
          </div>
        {/if}
        {#if candidate.municipality}
          <div class="contact-icons hover-tooltip" data-tooltip="Residence" style="font-size:0.95rem;margin-bottom:0.25rem">
            <img src={base + '/graphics/location.svg'} alt="Residence" style="height:1.5em;vertical-align:middle;margin-right:0.5rem" loading="lazy" />
            {candidate.municipality}
          </div>
        {/if}
        {#if candidate.age}
          <div class="contact-icons hover-tooltip" data-tooltip="Age as of election day" style="font-size:0.95rem;margin-bottom:0.25rem">
            <strong>Age:</strong> {candidate.age}
          </div>
        {/if}
        <div class="contact-icons" style="margin-top:1.5rem">
          {#if candidate.email}
            <a class="hover-tooltip" data-tooltip="Email" href={"mailto:" + candidate.email} aria-label="Email">
              <img src={base + '/graphics/email.svg'} alt="Email" loading="lazy" />
            </a>
          {/if}
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

  {#if candidate.elected_experience}
    <div class="info-section">
      <h2>Elected Experience</h2>
      <p>{candidate.elected_experience}</p>
    </div>
  {/if}

    

  <div class="info-section">
    <h2>Basic Information</h2>
    <div class="candidate-basic-info">
      {#if candidate.basic_information}
        <div class="info-value">
          {candidate.basic_information}
        </div>
      {/if}
    </div>
  </div>

  {#if candidateQuestionsAndAnswers.length > 0}
    <div class="info-section">
      <h2>Q&A with the Candidate</h2>
      {#each candidateQuestionsAndAnswers as qa}
        <div class="qa-item" style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
            {qa.question_text}
          </h3>
          <p style="margin: 0; line-height: 1.6; color: #555;">
            {qa.answer}
          </p>
        </div>
      {/each}
    </div>
  {/if}

{/if}
