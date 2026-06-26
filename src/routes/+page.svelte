<svelte:head>
    <link rel="stylesheet" href="{base}/css/bento-grid.css">
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.15.0/dist/maplibre-gl.css">
</svelte:head>

<style>
    .sponsor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        }

    .sponsor-slot {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        }
        
    .sponsor-slot img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        }

    .post-content a {
        font-family: 'Publico Banner', sans-serif;
    }

    .address-search-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    #address-map {
        background-color: #FFFFFF;
        border:#D5E2EE 2px solid;
        box-shadow: 0 6px 16px rgba(35, 49, 102, 0.08);
        border-radius: 50px;
        padding-top: 1rem;
        padding-bottom: 0rem;
        padding-left: 1rem;
        padding-right: 1rem;
        margin-top: 2rem;
        margin-bottom: 1rem;
    }

    .search-box {
        display: flex;
        gap: 0.5rem;
        position: relative;
    }

    .address-input {
        flex: 1;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 3px solid #0073aa;
        border-radius: 50px;
        transition: all 0.2s;
        background-color: #FFFFFF;
    }

    .address-input:hover, .address-input:focus {
        outline: none;
        border: 3px solid #233166;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: #EAF1F7;
    }

    .address-input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    .suggestions-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 0px solid #3090c9;
        border-top: none;
        border-radius: 0 0 4px 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        margin-top: 0px;
    }

    .suggestion-item {
        width: 100%;
        padding: 0.75rem 1rem;
        text-align: left;
        background: white;
        border: none;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        font-size: 0.95rem;
        color: #000;
        transition: background-color 0.2s;
    }

    .suggestion-item:last-child {
        border-bottom: none;
    }

    .suggestion-item:hover {
        background-color: #F3F6FA;
    }

    .error-message {
        padding: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 4px;
        color: #c00;
        margin-bottom: 1rem;
    }

    .error-message p {
        margin: 0;
    }

    .results-container {
        border-radius: 25px;
        padding: 2rem;
        margin-top: 1.5rem;
    }

    .results-container h3 {
        margin-top: 0;
        color: #333;
        text-align: center;
        font-size: 1.5rem;
    }

    .address-result {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .district-results {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin: 1.5rem 0;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }

    .district-card {
        background-color: white;
        border-radius: 25px;
        padding: 1.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        border-bottom: 2px solid #D5E2EE;
    }
    
    .district-card canvas {
        border-radius: 50px;
    }

    .district-card-link {
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .district-card-link:hover {
        transform: translateY(-4px);
    }

    .click-hint {
        margin-top: 1rem;
        color: #3090c9;
        font-weight: 700;
    }

    .district-card h4 {
        margin: 0 0 0.5rem 0;
        color: #3090c9;
        font-size: 1rem;
        font-weight: 600;
    }

    .district-number {
        margin: 0;
        font-size: 1.75rem;
        font-weight: bold;
        color: #233166;
    }

    .district-map {
        width: 100%;
        height: 350px;
        position: relative;
        border-radius: 4px;
        margin-top: 1rem;
        overflow: hidden;
        display: block;
    }
    
    .district-map canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
    }
    
    /* Hide MapLibre attribution */
    .district-map .maplibregl-ctrl-attrib,
    .district-map .maplibregl-ctrl-logo {
        display: none !important;
    }

    .coordinates-info {
        text-align: center;
        margin-top: 1rem;
        color: #999;
    }

    .coordinates-info small {
        font-size: 0.85rem;
    }

    .previous-results-container {
        background-color: #EAF1F7;
        padding: 1rem;
        margin-top: 1.5rem;
        text-align: center;
        border-bottom-left-radius: 50px;
        border-bottom-right-radius: 50px;
        margin-left: -1rem;
        margin-right: -1rem;
    }

    .previous-results-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1em;
    }

    .calendars-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .calendar {
        background: white;
        border-radius: 50px;
        padding: 1.5rem;
        box-shadow: 0 6px 16px rgba(35, 49, 102, 0.08);
        position: relative;
        overflow: visible;
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
    }

    .calendar-actions {
        font-family: 'Heebo', sans-serif;
    }

    .calendar-header {
        text-align: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #3090c9;
    }

    .calendar-header h4 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        width: 100%;
    }

    .calendar-day-header {
        text-align: center;
        font-weight: 600;
        color: #233166;
        padding: 0.5rem 0;
        font-size: 0.85rem;
    }

    .calendar-day {
        font-family: 'Heebo', sans-serif;
        font-weight: 500;
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50px;
        font-size: 0.95rem;
        color: #333;
        position: relative;
        transition: all 0.2s ease;
        min-width: 0;
        overflow: hidden;
    }

    .calendar-day.empty {
        visibility: hidden;
    }

    .calendar-day.highlighted {
        background: #3090C9;
        color: white;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 2px 8px #3090C9;
    }

    .calendar-day.highlighted:hover, .calendar-day.highlighted:active {
        transform: scale(1.1);
        box-shadow: 0 4px 12px #233166;
        background: #233166;
        transition: all 0.2s ease;
    }

    .tooltip-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
    }

    .calendar-tooltip {
        position: fixed;
        left: var(--tooltip-left, 50%);
        top: var(--tooltip-top, 50%);
        transform: translate(-50%, calc(-100% - 12px - 1em));
        background: #233166;
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 700;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        width: max-content;
        max-width: min(350px, calc(100vw - 2rem));
        white-space: normal;
        text-align: center;
        line-height: 1.5;

    }

    .calendar-tooltip.visible {
        opacity: 1;
    }

    .calendar-tooltip::after {
        content: '';
        position: absolute;
        border: 6px solid transparent;
        bottom: -12px;
        left: var(--arrow-left, 50%);
        transform: translateX(-50%);
        border-top-color: #233166;
    }

    /* Add-to-calendar button styles */
    .calendar-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }

    .calendar-btn {
        width: 30%;
    }

    .calendar-link {
        color: #3090c9;
        font-weight: 600;
        text-decoration: underline;
        background: none;
        border: none;
        padding: 0.4rem 0.6rem;
        border-radius: 6px;
        cursor: pointer;
    }

    .calendar-link:hover {
        color: #233166;
    }

    .suggestions-dropdown {
        opacity: 0.95;
        transform: translateY(0.5em);
        border-radius: 6px;
    }

    #author, #date {
        font-family: 'Heebo', sans-serif;
        font-size: 0.8rem;
        margin: 0.25rem 0 0 0;
        color: #515151;
    }

    .governor-race-bkg {
        grid-column: 3 / 11;
        z-index: -1;
        inset: 10px;
    }

    .governor-winner-left {
        grid-column: 1 / 6;
        border: #e9151f 15px solid !important;
    }
    
    .governor-winner-right {
        grid-column: 8 / 13;
        border: #0b3eb6 15px solid !important;
    }

    .governor-winner-main {
        grid-column: 4 / 10;
    }

    .governor-winner-main, .governor-winner-left, .governor-winner-right {
        background: white;
        border-radius: 50px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 6px 16px rgba(35, 49, 102, 0.08);
        border: #D5E2EE 15px solid;
    }

    .governor-winner-main:hover, .governor-winner-left:hover, .governor-winner-right:hover {
        box-shadow: 0 6px 16px rgba(35, 49, 102, 0.2);
        border: #233166 15px solid !important;
        transition: all 0.3s ease;
    }

    .governor-winner-main.disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .governor-winner-main.disabled:hover {
        box-shadow: 0 6px 16px rgba(35, 49, 102, 0.08);
        border: #D5E2EE 15px solid !important;
    }

    .governor-winner-main picture, .governor-winner-left picture, .governor-winner-right picture {
        border-radius: 50px !important;
    }

    @media (max-width: 820px) {
        .calendars-container {
            padding: 0 0.5rem;
            gap: 1.5rem;
        }

        .calendar {
            padding: 1rem;
        }

        .calendar-grid {
            gap: 0.3rem;
        }

        .calendar-day {
            font-size: 0.8rem;
        }

        .calendar-day-header {
            font-size: 0.75rem;
        }

        .calendar-header h4 {
            font-size: 1.3rem;
        }
    }

    @media (max-width: 760px) {
        .search-box {
            flex-direction: column;
        }

        .search-button {
            width: 100%;
        }

        .previous-results-buttons {
            gap: 0.5rem;
        }

        .calendars-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0 0.5rem;
        }

        .calendar {
            padding: 0.75rem;
        }

        .calendar-grid {
            gap: 0.15rem;
        }

        .calendar-day {
            font-size: 1rem;
        }

        .calendar-day-header {
            font-size: 1.25rem;
            padding: 0.35rem 0;
        }

        .calendar-header {
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
        }

        .calendar-header h4 {
            font-size: 1.5rem;
        }

        .calendar-tooltip {
            max-width: min(280px, calc(100vw - 2rem));
            font-size: 1rem;
            padding: 0.5rem 0.75rem;
        }

        .governor-race-bkg {
            grid-column: 3 / 11;
            z-index: -1;
        }

        .governor-winner-left {
            grid-column: 1 / 7;
        }
        
        .governor-winner-right {
            grid-column: 7 / 13;
        }

        .governor-winner-main {
            grid-column: 2 / 12;
        }
    }

    @media (min-width: 760px) {

        .hero {
            padding-top: 15vh !important;
            padding-bottom: 10vh !important;
        }

        #governors-race .bento-container {
            display: grid !important;
            grid-template-columns: 1fr 2fr 1fr;
            grid-template-rows: 1fr 1fr;
            grid-auto-flow: unset;
            position: relative;
        }

        #governors-race .governor-winner-left {
            grid-column: 1 !important;
            grid-row: 1 !important;
        }

        #governors-race .governor-winner-right {
            grid-column: 1 !important;
            grid-row: 2 !important;
        }

        #governors-race .governor-race-bkg {
            grid-column: 2 !important;
            grid-row: 1 / 3 !important;
            position: relative !important;
            inset: auto !important;
            z-index: 0;
            height: 100%;
            align-self: stretch;
        }

        #governors-race .governor-race-bkg picture,
        #governors-race .governor-race-bkg img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        #governors-race .governor-winner-main {
            grid-column: 3 !important;
            grid-row: 1 / 3 !important;
            align-self: center;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
    }

    @media (max-width: 480px) {
        .address-search-container {
            padding: 0 0.1rem;
        }

        .calendars-container {
            padding: 0 0.25rem;
        }

        .calendar {
            padding: 0.5rem;
        }

        .calendar-grid {
            gap: 0.1rem;
        }

        .calendar-day {
            border-radius: 50px;
        }

        .calendar-day-header {
            font-size: 0.8rem;
            padding: 0.25rem 0;
        }

        .calendar-header {
            padding-top: 1rem;
            margin-bottom: 0.5rem;
            padding-bottom: 1rem;
        }

        .calendar-tooltip {
            max-width: 70vw;
            font-size: 0.9rem;
            padding: 0.4rem 0.6rem;
        }
    }
</style>

<script>
    import { onMount, onDestroy, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { findDistrictsForAddress } from '$lib/districtLookup.js';
    import { getRaceByDistrict, getStatewideRaces } from '$lib/googleSheets.js';
    import { saveRacesToLocalStorage, loadRacesFromLocalStorage } from '$lib/raceStorage.js';
    import { initializeDistrictMap } from '$lib/mapUtils.js';
    
    export let data;

    function navigate(url) {
        if (url.startsWith('http')) {
            window.location.href = url;
        } else {
            goto(`${base}${url}`);
        }
    }

    let pymChild;
    let contentElement;
    let webcalUrl = '';
    
    // Statewide races state
    let statewideRaces = [];
    let primaryRaces = [];
    let otherRaces = [];
    
    // Address search state
    let searchAddress = '';
    let searching = false;
    let searchError = null;
    let districtResults = null;
    let suggestions = [];
    let showSuggestions = false;
    let debounceTimer;
    
    // Saved races from localStorage
    let savedRaces = null;
    
    // Date check for governor-winner-main link
    const enableGovernorLinkDate = new Date('2026-08-11T00:00:00');
    $: isGovernorLinkEnabled = new Date() >= enableGovernorLinkDate;
    
    // Tooltip state
    let currentTooltipText = '';
    let tooltipVisible = false;
    let tooltipLeft = '50%';
    let tooltipTop = '50%';
    let arrowLeft = '50%';
    let pinnedTooltipTarget = null; // element pinned by click
    let currentTooltipTarget = null; // currently hovered or focused element

    // Key dates for the calendar (populated from ICS file)
    let keyDates = {};

    async function fetchAndParseICS() {
        try {
            const resp = await fetch(`${base}/others/WI-2026-Election-Key-Dates.ics`);
            if (!resp.ok) return;
            const icsText = await resp.text();
            keyDates = parseICSForDates(icsText);
        } catch (e) {
            console.error('Failed to load ICS:', e);
        }
    }

    function parseICSForDates(icsText) {
        const map = {};
        // Split into VEVENT blocks
        const events = icsText.split(/BEGIN:VEVENT/i).slice(1);
        for (const ev of events) {
            // Find DTSTART
            const dtMatch = ev.match(/DTSTART(?:;[^:]*)?:([0-9TZ+-]+)/i);
            if (!dtMatch) continue;
            const dt = dtMatch[1];
            // Extract date portion YYYYMMDD (handles YYYYMMDD or YYYYMMDDTHHMMSS)
            const datePart = dt.split('T')[0];
            if (!/^[0-9]{8}$/.test(datePart)) continue;
            const year = datePart.slice(0,4);
            const month = datePart.slice(4,6);
            const day = datePart.slice(6,8);
            // Find SUMMARY (may be folded across lines; unfold per RFC5545)
            const unfolded = ev.replace(/\r?\n[ \t]/g, '');
            const sumMatch = unfolded.match(/SUMMARY:(.*?)(?:\r?\n|$)/i);
            const summary = sumMatch ? sumMatch[1].trim() : '';
            // Map to MM-DD
            const key = `${month}-${day}`;
            if (summary) map[key] = summary;
        }
        return map;
    }

    // Calendar event metadata + helper functions for Add-to-Calendar buttons
    const calendarTitle = 'Wisconsin 2026 Election Key Dates';
    const calendarLocation = 'Wisconsin';
    $: calendarDescription = Object.entries(keyDates)
        .map(([d, txt]) => `${d}: ${txt}`)
        .join('\n');

    function openGoogleCalendar() {
        // Use an all-day event spanning the key date range (end date is exclusive)
        const dates = '20260701/20261130';
        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarTitle)}&dates=${dates}&details=${encodeURIComponent(calendarDescription)}&location=${encodeURIComponent(calendarLocation)}`;
        window.open(url, '_blank');
    }

    function openOutlook() {
        // Outlook web expects ISO datetimes; use midnight-local for all-day span
        const start = '2026-07-01T00:00:00';
        const end = '2026-11-30T00:00:00';
        const url = `https://outlook.live.com/owa/?rru=addevent&startdt=${encodeURIComponent(start)}&enddt=${encodeURIComponent(end)}&subject=${encodeURIComponent(calendarTitle)}&body=${encodeURIComponent(calendarDescription)}&location=${encodeURIComponent(calendarLocation)}`;
        window.open(url, '_blank');
    }

    function downloadICS() {
        const uid = `${Date.now()}@wisconsinwatch.org`;
        const now = new Date();
        const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const dtstart = '20260701';
        const dtend = '20261130';
        const icsLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Wisconsin Watch//Election Key Dates//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART;VALUE=DATE:${dtstart}`,
            `DTEND;VALUE=DATE:${dtend}`,
            `SUMMARY:${calendarTitle}`,
            `DESCRIPTION:${calendarDescription.replace(/\n/g, '\\n')}`,
            `LOCATION:${calendarLocation}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ];

        const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'WI-2026-Election-Key-Dates.ics';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 1000);
    }

    function subscribeWebcal() {
        if (typeof window === 'undefined') return;
        const host = window.location.host;
        const protocol = 'webcal://';
        // Ensure base begins with a slash
        const path = `${base}/others/WI-2026-Election-Key-Dates.ics`;
        const url = `${protocol}${host}${path}`;
        // Navigate to the webcal URL to trigger calendar subscription in supporting clients
        window.location.href = url;
    }

    function generateCalendar(month, year, keyDatesObj) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Add empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ day: null, isEmpty: true });
        }
        
        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const dateKey = `${monthStr}-${dayStr}`;
            const isHighlighted = keyDatesObj && keyDatesObj.hasOwnProperty && keyDatesObj.hasOwnProperty(dateKey);
            
            days.push({
                day,
                isEmpty: false,
                isHighlighted,
                tooltip: isHighlighted ? keyDates[dateKey] : null
            });
        }
        
        return days;
    }

    $: julyDays = generateCalendar(6, 2026, keyDates); // July = month 6 (0-indexed)
    $: augustDays = generateCalendar(7, 2026, keyDates); // August = month 7 (0-indexed)
    $: octoberDays = generateCalendar(9, 2026, keyDates); // October = month 9 (0-indexed)
    $: novemberDays = generateCalendar(10, 2026, keyDates); // November = month 10

    async function fetchSuggestions(query) {
        if (query.length < 10) {
            suggestions = [];
            showSuggestions = false;
            return;
        }

        try {
            // Call Mapbox API directly with the public token
            const encodedQuery = encodeURIComponent(query);
            const mapboxToken = data.mapboxToken;
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&country=US&limit=5&types=address&bbox=-92.889,42.491,-86.249,47.309`;
            
            const response = await fetch(url);
            if (response.ok) {
                const responseData = await response.json();
                // Filter to only include Wisconsin addresses with complete street addresses
                const wisconsinSuggestions = responseData.features.filter(feature => {
                    const context = feature.context || [];
                    const isInWisconsin = context.some(ctx => 
                        ctx.id.startsWith('region') && 
                        (ctx.text === 'Wisconsin' || ctx.short_code === 'US-WI')
                    );
                    
                    // Ensure it's a complete address (has street number)
                    const addressText = feature.place_name || feature.text || '';
                    const hasStreetNumber = /^\d+/.test(addressText.trim());
                    
                    // Ensure it's actually an address type, not just a street
                    const isAddressType = feature.place_type && feature.place_type.includes('address');
                    return isInWisconsin && hasStreetNumber && isAddressType;
                });
                
                suggestions = wisconsinSuggestions.map(feature => ({
                    text: feature.place_name,
                    coordinates: feature.center
                }));
                showSuggestions = suggestions.length > 0;
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchSuggestions(searchAddress);
        }, 300);
    }

    function selectSuggestion(suggestion) {
        searchAddress = suggestion.text;
        suggestions = [];
        showSuggestions = false;
        handleAddressSearch();
    }

    function validateAddressFormat(address) {
        // Check if address contains a street number at the beginning
        const hasStreetNumber = /^\d+/.test(address.trim());
        
        // Check if address has multiple components (street number, street name, city)
        const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
        const hasMultipleParts = parts.length >= 2;
        
        // Check if it's just a city name (no street number)
        const cityOnlyPattern = /^[A-Za-z\s]+,?\s*(WI|Wisconsin)?$/i;
        const isCityOnly = cityOnlyPattern.test(address.trim());
        
        // Check if it's just a street name without number
        const streetOnlyPattern = /^[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Circle|Cir)$/i;
        const isStreetOnly = streetOnlyPattern.test(address.trim());
        
        return hasStreetNumber && hasMultipleParts && !isCityOnly && !isStreetOnly;
    }

    async function handleAddressSearch() {
        if (!searchAddress.trim()) {
            searchError = 'Please enter an address';
            return;
        }
        
        // Validate address format before searching
        if (!validateAddressFormat(searchAddress)) {
            searchError = 'Please enter a complete physical address including street number, street name, and city. Example: "2 E Main Street, Madison, WI"';
            return;
        }

        searching = true;
        searchError = null;
        districtResults = null;
        showSuggestions = false;

        try {
            districtResults = await findDistrictsForAddress(searchAddress, data.mapboxToken);
            
            // Fetch race IDs for each district
            if (districtResults && districtResults.districts) {
                const races = await Promise.all([
                    districtResults.districts.assembly ? getRaceByDistrict(districtResults.districts.assembly, 'Assembly') : null,
                    districtResults.districts.senate ? getRaceByDistrict(districtResults.districts.senate, 'Senate') : null,
                    districtResults.districts.congress ? getRaceByDistrict(districtResults.districts.congress, 'US Congress') : null
                ]);
                
                districtResults.raceIds = {
                    assembly: races[0]?.['race-id'] || null,
                    senate: races[1]?.['race-id'] || null,
                    congress: races[2]?.['race-id'] || null
                };
                
                // Save races to localStorage
                savedRaces = saveRacesToLocalStorage(districtResults.raceIds, districtResults.address);
            }
            
            // Wait for DOM update then initialize maps
            await tick();
            initializeMaps();
        } catch (error) {
            searchError = error.message || 'Failed to find districts for this address';
            console.error('District search error:', error);
        } finally {
            searching = false;
        }
    }

    async function initializeMaps() {
        if (!districtResults) return;

        // Use requestAnimationFrame to ensure DOM is painted and containers have dimensions
        requestAnimationFrame(async () => {
            // Initialize Assembly map
            if (districtResults.districts.assembly) {
                await initializeDistrictMap('assembly-map', `${base}/map-pmtiles/WI_Assembly_Districts_2026.pmtiles`, 'ASM2024', districtResults.districts.assembly);
            }

            // Initialize Senate map
            if (districtResults.districts.senate) {
                await initializeDistrictMap('senate-map', `${base}/map-pmtiles/WI_Senate_Districts_2026.pmtiles`, 'SEN2024', districtResults.districts.senate);
            }

            // Initialize Congress map
            if (districtResults.districts.congress) {
                await initializeDistrictMap('congress-map', `${base}/map-pmtiles/WI_Congressional_Districts_2026.pmtiles`, 'CON2021', districtResults.districts.congress);
            }
        });
    }

    onMount(async () => {

        // Initialize pym.js child
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
        // Build webcal URL on client so it's a real href the browser can handle
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const protocol = 'webcal://';
            webcalUrl = `${protocol}${host}${base}/others/WI-2026-Election-Key-Dates.ics`;
        }
        
        // Load saved races from localStorage
        savedRaces = loadRacesFromLocalStorage();

        // Load statewide races dynamically from Google Sheets
        try {
            const races = await getStatewideRaces();
            statewideRaces = races;
            
            // Separate primary races (Attorney General) from others
            primaryRaces = races.filter(race => 
                race.value === 'Attorney General'
            );
            
            otherRaces = races.filter(race => 
                race.value !== 'Governor' && race.value !== 'Attorney General'
            );
        } catch (error) {
            console.error('Error loading statewide races:', error);
        }

        // Load key dates from ICS so calendar highlights come from the .ics file
        fetchAndParseICS();

        // Add tooltip positioning logic after a short delay to ensure DOM is ready
        setTimeout(() => {
            setupTooltipPositioning();
        }, 100);

        // Reposition tooltip on scroll/resize and add outside-click unpin
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        document.addEventListener('click', (e) => {
            if (!e.target.closest || !e.target.closest('.calendar-day.highlighted')) {
                pinnedTooltipTarget = null;
                tooltipVisible = false;
                currentTooltipText = '';
                currentTooltipTarget = null;
            }
        });
    });

    onDestroy(() => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
    });

    function setupTooltipPositioning() {
        // Get all highlighted calendar days
        const highlightedDays = document.querySelectorAll('.calendar-day.highlighted');

        highlightedDays.forEach(day => {
            day.addEventListener('mouseenter', (e) => {
                const tooltip = e.currentTarget.getAttribute('data-tooltip');
                if (tooltip) {
                    currentTooltipText = tooltip;
                    tooltipVisible = true;
                    currentTooltipTarget = e.currentTarget;
                    // Position above the element (centered)
                    positionTooltipAboveElement(e.currentTarget);
                }
            });

            // Keyboard accessibility: show tooltip on focus
            day.addEventListener('focus', (e) => {
                const tooltip = e.currentTarget.getAttribute('data-tooltip');
                if (tooltip) {
                    currentTooltipText = tooltip;
                    tooltipVisible = true;
                    currentTooltipTarget = e.currentTarget;
                    positionTooltipAboveElement(e.currentTarget);
                }
            });

            // Hide on mouse leave or blur
            day.addEventListener('mouseleave', () => {
                // only hide if this day isn't pinned by click
                if (pinnedTooltipTarget !== day) {
                    tooltipVisible = false;
                    currentTooltipText = '';
                    currentTooltipTarget = null;
                }
            });

            day.addEventListener('blur', () => {
                if (pinnedTooltipTarget !== day) {
                    tooltipVisible = false;
                    currentTooltipText = '';
                    currentTooltipTarget = null;
                }
            });

            // Click to pin/unpin the tooltip for this day
            day.addEventListener('click', (e) => {
                const tooltip = e.currentTarget.getAttribute('data-tooltip');
                if (!tooltip) return;

                if (pinnedTooltipTarget === e.currentTarget) {
                    // Unpin
                    pinnedTooltipTarget = null;
                    tooltipVisible = false;
                    currentTooltipText = '';
                    currentTooltipTarget = null;
                } else {
                    // Pin this element
                    pinnedTooltipTarget = e.currentTarget;
                    currentTooltipText = tooltip;
                    tooltipVisible = true;
                    currentTooltipTarget = e.currentTarget;
                    positionTooltipAboveElement(e.currentTarget);
                }
            });
        });
    }
    
    function positionTooltipAboveElement(targetEl) {
        const tooltipElement = document.querySelector('.calendar-tooltip');
        const section = document.querySelector('#Keydates');

        if (!tooltipElement || !section || !targetEl) return;

        const rect = targetEl.getBoundingClientRect();

        // Center X of the target element (viewport coords)
        const centerX = rect.left + rect.width / 2;
        // Use the element's top (viewport coords); CSS transform moves tooltip upward
        const topY = rect.top;

        tooltipLeft = `${centerX}px`;
        tooltipTop = `${topY}px`;
        arrowLeft = '50%';

        // After tooltip renders, clamp horizontally and adjust arrow
        setTimeout(() => {
            if (!tooltipElement) return;
            const tRect = tooltipElement.getBoundingClientRect();
            const halfWidth = tRect.width / 2;
            const padding = 12; // keep tooltip away from edges

            let finalCenter = centerX;
            const minCenter = halfWidth + padding;
            const maxCenter = window.innerWidth - halfWidth - padding;
            if (finalCenter < minCenter) finalCenter = minCenter;
            if (finalCenter > maxCenter) finalCenter = maxCenter;

            tooltipLeft = `${finalCenter}px`;

            // Arrow offset percent relative to tooltip width
            const arrowOffset = centerX - finalCenter;
            const arrowPct = 50 + ((arrowOffset / tRect.width) * 100);
            arrowLeft = `${Math.max(15, Math.min(85, arrowPct))}%`;
        }, 0);
    }

    function handleScroll() {
        const target = pinnedTooltipTarget || currentTooltipTarget;
        if (tooltipVisible && target) {
            positionTooltipAboveElement(target);
        }
    }

    function handleResize() {
        const target = pinnedTooltipTarget || currentTooltipTarget;
        if (tooltipVisible && target) {
            positionTooltipAboveElement(target);
        }
    }

    // Script for animated banner

    onMount(() => {
        const banner = document.getElementById('header-banner-full');
        if (!banner) return;

        banner.addEventListener('load', () => {
            const svgDoc = banner.contentDocument;
            if (!svgDoc) return;

            function animateBubble(id, amplitude, speed, phase = 0) {
                const el = svgDoc.getElementById(id);
                if (!el) return;
                let start = null;
                function step(ts) {
                    if (!start) start = ts;
                    const t = (ts - start) / 1000;
                    const x = Math.sin(t * speed + phase) * amplitude;
                    el.setAttribute('transform', `translate(${x},0)`);
                    requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }
            animateBubble('large-bubble', 40, 0.7);
            animateBubble('small-bubble', 25, 1.1, Math.PI / 2);
        });
    });


    // Script for animated banner

    onMount(() => {
        const banner = document.getElementById('header-banner-mobile');
        if (!banner) return;

        banner.addEventListener('load', () => {
            const svgDoc = banner.contentDocument;
            if (!svgDoc) return;

            function animateBubble(id, amplitude, speed, phase = 0) {
                const el = svgDoc.getElementById(id);
                if (!el) return;
                let start = null;
                function step(ts) {
                    if (!start) start = ts;
                    const t = (ts - start) / 1000;
                    const x = Math.sin(t * speed + phase) * amplitude;
                    el.setAttribute('transform', `translate(${x},0)`);
                    requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }
            animateBubble('large-bubble', 30, 0.7);
            animateBubble('small-bubble', 15, 1.1, Math.PI / 2);
        });
    });

</script>

<div id="content" class="site-content" bind:this={contentElement}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">

            <section class="hero">
                <header class="entry-header">
                    <object type="image/svg+xml" data="{base}/graphics/banner/Banner_PC.svg" id="header-banner-full"></object>	
                    <object type="image/svg+xml" data="{base}/graphics/banner/Banner_Mobile.svg" id="header-banner-mobile"></object>
                    <style>
                        /* Default: Mobile first */
                        #header-banner-full { display: none; }
                        #header-banner-mobile { display: block; }

                        /* Small screens (e.g., phones) */
                        @media (max-width: 600px) {
                            #header-banner-full { display: none; }
                            #header-banner-mobile { display: block; }
                        }

                        /* Large screens (e.g., desktops) */
                        @media (min-width: 601px) {
                            #header-banner-full { display: block; }
                            #header-banner-mobile { display: none; }
                        }
                    </style>				
                </header>
            </section>



            <div class="entry-content" style="padding-top: 4rem;">

                <div class="entry-content">

                    <section id="governors-race">
                        <h2 class="wp-block-heading has-text-align-center">Governor's Race</h2>

                        <div class="bento-container grid grid-cols-12 grid-flow-dense gap-4">
                            <a class="bento-item governor-winner-left" href="{base}/race/governor-republican-primary/go-r">
                                <div class="winner-label">
                                    <h4>Republican Primary</h4>
                                </div>
                                <img src="{base}/graphics/candidates/winner-who.png" alt="Winner image"/>
                            </a>
                            <a class="bento-item governor-winner-right" href="{base}/race/governor-democrat-primary/go-d">
                                <div class="winner-label">
                                    <h4>Democrat Primary</h4>
                                </div>
                                <img src="{base}/graphics/candidates/winner-who.png" alt="Winner image"/>
                            </a>
                            <!-- Background -->
                            <div class="governor-race-bkg absolute inset-0 z-0 flex justify-center items-center">
                                <picture>
                                    <source 
                                        srcset="{base}/graphics/racecard-bkg_Mobile.png" 
                                        media="(max-width: 760px)" />
                                    
                                    <img src="{base}/graphics/racecard-bkg_Desktop.png"
                                        alt="Governor's race background image"
                                        class="governor-race-image w-full h-full object-cover opacity-80" />
                                </picture>
                            </div>
                            <!-- Main Governor Race-->
                            {#if isGovernorLinkEnabled}
                                <a class="bento-item governor-winner-main" href="{base}/race/governor/1">
                                    <div class="winner-label">
                                        <h4>Final Race</h4>
                                    </div>
                                    <img src="{base}/graphics/candidates/winner-who.png" alt="Winner image"/>
                                </a>
                            {:else}
                                <div class="bento-item governor-winner-main disabled">
                                    <div class="winner-label">
                                        <h4>Final Race</h4>
                                        <small>(Unlock after primary race)</small>
                                    </div>
                                    <img src="{base}/graphics/candidates/winner-who.png" alt="Winner image"/>
                                </div>
                            {/if}
                        </div>

                    </section>
		
                    <section id="address-map">
                        <h2 class="wp-block-heading has-text-align-center"><strong>Find Your Districts</strong></h2>
                        <p class="has-text-align-center">Enter your Wisconsin address to find your <strong>Assembly</strong>, <strong>Senate</strong>, and <strong>Congressional</strong> districts.</p>
                        <div class="address-search-container">
                            <div class="search-box">
                                <input 
                                    type="text" 
                                    bind:value={searchAddress}
                                    on:input={handleInput}
                                    on:keydown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                    on:blur={() => setTimeout(() => showSuggestions = false, 200)}
                                    placeholder="Enter your address (e.g., 2 E Main St, Madison, WI)"
                                    class="address-input"
                                    disabled={searching}
                                    autocomplete="off"
                                />
                                
                                {#if showSuggestions && suggestions.length > 0}
                                    <div class="suggestions-dropdown">
                                        {#each suggestions as suggestion}
                                            <button 
                                                class="suggestion-item"
                                                on:click={() => selectSuggestion(suggestion)}
                                                type="button"
                                            >
                                                {suggestion.text}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}

                                <button 
                                    on:click={handleAddressSearch}
                                    disabled={searching}
                                    class="search-button"
                                >
                                    {searching ? 'Searching...' : 'Search'}
                                    {#if !searching}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 1em; width: 1em; margin-left: 0.5rem; vertical-align: middle; display: inline-block;">
                                            <g>
                                                <circle cx="8.4" cy="8.4" r="6.9" style="fill: #3091c9;"/>
                                                <path d="M8.4,3c2.98,0,5.4,2.42,5.4,5.4s-2.42,5.4-5.4,5.4-5.4-2.42-5.4-5.4,2.42-5.4,5.4-5.4M8.4,0C3.76,0,0,3.76,0,8.4s3.76,8.4,8.4,8.4,8.4-3.76,8.4-8.4S13.04,0,8.4,0h0Z" style="fill: #fff;"/>
                                            </g>
                                            <line x1="24" y1="24" x2="14.08" y2="14.26" style="fill: none; stroke: #fff; stroke-miterlimit: 10; stroke-width: 3px;"/>
                                        </svg>
                                    {/if}
                                </button>
                            </div>
                            <small style="transform:translateY(0.5em);"><i>We do not save your data! Read our privacy policy <a href="https://wisconsinwatch.org/about/user-agreement-and-privacy-policy/">here</a> .</i></small> 

                            {#if searchError}
                                <div class="error-message">
                                    <p><strong>Error:</strong> {searchError}</p>
                                </div>
                            {/if}

                            {#if districtResults}
                                <div class="results-container">
                                    <h3>Your Districts</h3>
                                    <p class="address-result"><strong>Address:</strong> {districtResults.address}</p>
                                    
                                    <div class="district-results">
                                        {#if districtResults.raceIds?.assembly}
                                            <a href="{base}/race/assembly/{districtResults.raceIds.assembly}" class="district-card district-card-link">
                                                <p class="district-number">
                                                    Assembly {districtResults.districts.assembly ? `District ${districtResults.districts.assembly}` : 'Not found'}
                                                </p>
                                                {#if districtResults.districts.assembly}
                                                    <div id="assembly-map" class="district-map"></div>
                                                {/if}
                                                <p class="click-hint">Click to view race details</p>
                                            </a>
                                        {:else}
                                            <div class="district-card">
                                                <p class="district-number">Assembly Not found</p>
                                            </div>
                                        {/if}

                                        {#if districtResults.raceIds?.senate}
                                            <a href="{base}/race/senate/{districtResults.raceIds.senate}" class="district-card district-card-link">
                                                <p class="district-number">
                                                    Senate {districtResults.districts.senate ? `District ${districtResults.districts.senate}` : 'Not found'}
                                                </p>
                                                {#if districtResults.districts.senate}
                                                    <div id="senate-map" class="district-map"></div>
                                                {/if}
                                                <p class="click-hint">Click to view race details</p>
                                            </a>
                                        {:else}
                                            <div class="district-card">
                                                <p class="district-number">Senate Not found</p>
                                            </div>
                                        {/if}

                                        {#if districtResults.raceIds?.congress}
                                            <a href="{base}/race/congress/{districtResults.raceIds.congress}" class="district-card district-card-link">
                                                <p class="district-number">
                                                   U.S. Congress {districtResults.districts.congress ? `District ${districtResults.districts.congress}` : 'Not found'}
                                                </p>
                                                {#if districtResults.districts.congress}
                                                    <div id="congress-map" class="district-map"></div>
                                                {/if}
                                                <p class="click-hint">Click to view race details</p>
                                            </a>
                                        {:else}
                                            <div class="district-card">
                                                <p class="district-number">U.S. Congress Not found</p>
                                            </div>
                                        {/if}
                                    </div>

                                    <p class="coordinates-info">
                                        <small>Location coordinates: {districtResults.coordinates.lat.toFixed(6)}, {districtResults.coordinates.lng.toFixed(6)}</small>
                                    </p>
                                </div>
                            {/if}
                        </div>
                        
                        {#if savedRaces && (savedRaces.assembly || savedRaces.senate || savedRaces.congress)}
                            <div class="previous-results-container">
                                <h3 style="margin-bottom: 0; margin-top: 0;">Your Previous Search Results</h3>
                                {#if savedRaces.address}
                                    <small class="address-result"><strong>Address:</strong> {savedRaces.address}</small>
                                {/if}
                                <div class="previous-results-buttons">
                                    {#if savedRaces.assembly}
                                        <button class="previous-result-button" on:click={() => goto(`${base}/race/assembly/${savedRaces.assembly}`)}>
                                            Assembly
                                        </button>
                                    {/if}
                                    {#if savedRaces.senate}
                                        <button class="previous-result-button" on:click={() => goto(`${base}/race/senate/${savedRaces.senate}`)}>
                                            Senate
                                        </button>
                                    {/if}
                                    {#if savedRaces.congress}
                                        <button class="previous-result-button" on:click={() => goto(`${base}/race/congress/${savedRaces.congress}`)}>
                                            U.S. Congress
                                        </button>
                                    {/if}
                                </div>
                            </div> 
                        {/if}
                    </section>

                    <section id="other-races">
                        <h2 class="wp-block-heading has-text-align-center">Other general Wisconsin elections</h2>

                        <div class="block-buttons is-horizontal is-content-justification-center is-layout-flex">
                            {#each primaryRaces as race}
                                <button class="election-button primary-race" on:click={() => navigate(`/race/${race.slug}/1`)}>
                                    {race.label}
                                </button>
                            {/each}
                            {#each otherRaces as race}
                                <button class="election-button primary-race" on:click={() => navigate(`/race/${race.slug}/1`)}>
                                    {race.label}
                                </button>
                            {/each}
                        </div>

                    </section>

                    <!-- Voter Guide Test -->
                    <script>
                        if (!window.__broadstreetInitialized) {
                            broadstreet.watch({ networkId: 9723 });
                            window.__broadstreetInitialized = true;
                        }
                    </script>
                    <broadstreet-zone zone-id="190680"></broadstreet-zone>

                    <section id="Keydates" style="margin: 0 0; overflow-x: hidden; width: 100%; position: relative;">
                        <h2 class="wp-block-heading has-text-align-center">Save these dates</h2>
                        <div class="calendar-actions">
                            <a href={webcalUrl} class="calendar-link">Add to Google, Apple, or Outlook calendar</a>
                            <a href="{base}/others/WI-2026-Election-Key-Dates.ics" class="calendar-link" target="_blank" rel="noopener">Download to local (.ics)</a>
                        </div>
                        <p class="has-text-align-center"><small><i>Hover over highlighted dates for details.</i></small></p>
                        
                        <!-- Dedicated Tooltip Container -->
                        <div class="tooltip-container">
                            <div class="calendar-tooltip {tooltipVisible ? 'visible' : ''}" 
                                 style="--tooltip-left: {tooltipLeft}; --tooltip-top: {tooltipTop}; --arrow-left: {arrowLeft};">
                                {currentTooltipText}
                            </div>
                        </div>
                        
                        <div class="calendars-container">
                            <!-- July 2026 Calendar -->
                            <div class="calendar">
                                <div class="calendar-header">
                                    <h4>July 2026</h4>
                                </div>
                                <div class="calendar-grid">
                                    <div class="calendar-day-header">Sun</div>
                                    <div class="calendar-day-header">Mon</div>
                                    <div class="calendar-day-header">Tue</div>
                                    <div class="calendar-day-header">Wed</div>
                                    <div class="calendar-day-header">Thu</div>
                                    <div class="calendar-day-header">Fri</div>
                                    <div class="calendar-day-header">Sat</div>
                                    
                                    {#each julyDays as dayInfo}
                                        <div class="calendar-day {dayInfo.isEmpty ? 'empty' : ''} {dayInfo.isHighlighted ? 'highlighted' : ''}" 
                                             data-tooltip="{dayInfo.isHighlighted ? dayInfo.tooltip : ''}">
                                            {#if !dayInfo.isEmpty}
                                                {dayInfo.day}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                        <!-- August 2026 Calendar -->
                            <div class="calendar">
                                <div class="calendar-header">
                                    <h4>August 2026</h4>
                                </div>
                                <div class="calendar-grid">
                                    <div class="calendar-day-header">Sun</div>
                                    <div class="calendar-day-header">Mon</div>
                                    <div class="calendar-day-header">Tue</div>
                                    <div class="calendar-day-header">Wed</div>
                                    <div class="calendar-day-header">Thu</div>
                                    <div class="calendar-day-header">Fri</div>
                                    <div class="calendar-day-header">Sat</div>
                                    
                                    {#each augustDays as dayInfo}
                                        <div class="calendar-day {dayInfo.isEmpty ? 'empty' : ''} {dayInfo.isHighlighted ? 'highlighted' : ''}" 
                                             data-tooltip="{dayInfo.isHighlighted ? dayInfo.tooltip : ''}">
                                            {#if !dayInfo.isEmpty}
                                                {dayInfo.day}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- October 2026 Calendar -->
                            <div class="calendar">
                                <div class="calendar-header">
                                    <h4>October 2026</h4>
                                </div>
                                <div class="calendar-grid">
                                    <div class="calendar-day-header">Sun</div>
                                    <div class="calendar-day-header">Mon</div>
                                    <div class="calendar-day-header">Tue</div>
                                    <div class="calendar-day-header">Wed</div>
                                    <div class="calendar-day-header">Thu</div>
                                    <div class="calendar-day-header">Fri</div>
                                    <div class="calendar-day-header">Sat</div>
                                    
                                    {#each octoberDays as dayInfo}
                                        <div class="calendar-day {dayInfo.isEmpty ? 'empty' : ''} {dayInfo.isHighlighted ? 'highlighted' : ''}" 
                                             data-tooltip="{dayInfo.isHighlighted ? dayInfo.tooltip : ''}"
                                             tabindex={dayInfo.isEmpty ? undefined : 0}>
                                            {#if !dayInfo.isEmpty}
                                                {dayInfo.day}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- November 2026 Calendar -->
                            <div class="calendar">
                                <div class="calendar-header">
                                    <h4>November 2026</h4>
                                </div>
                                <div class="calendar-grid">
                                    <div class="calendar-day-header">Sun</div>
                                    <div class="calendar-day-header">Mon</div>
                                    <div class="calendar-day-header">Tue</div>
                                    <div class="calendar-day-header">Wed</div>
                                    <div class="calendar-day-header">Thu</div>
                                    <div class="calendar-day-header">Fri</div>
                                    <div class="calendar-day-header">Sat</div>
                                    
                                    {#each novemberDays as dayInfo}
                                        <div class="calendar-day {dayInfo.isEmpty ? 'empty' : ''} {dayInfo.isHighlighted ? 'highlighted' : ''}" 
                                             data-tooltip="{dayInfo.isHighlighted ? dayInfo.tooltip : ''}"
                                             tabindex={dayInfo.isEmpty ? undefined : 0}>
                                            {#if !dayInfo.isEmpty}
                                                {dayInfo.day}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="voting-info">
                        <h2 class="wp-block-heading has-text-align-center">Election Q&As</h2>
                        <div class ="bento-container grid grid-cols-12 grid-flow-dense gap-4">
                            <section class="bento-section bento-section-primary ring col-span-full md:col-span-6 xl:col-span-6 xl:row-span-3">
                                <div class="bento-image-container">
                                    <img srcset="https://wisconsinwatch.org/wp-content/uploads/2024/11/Legislative-Race-Results-1.jpg">
                                    <figcaption><span>Jennifer Taylor, left, votes during Election Day on Nov. 5, 2024, at Madison East High School in Madison, Wis. (Joe Timmerman / Wisconsin Watch)</span></figcaption>
                                </div>
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>Who can vote?</strong></h3>
                                    <p>To register to vote in Wisconsin, you must meet the following <a href="https://www.cityofmadison.com/clerk/elections-voting/voter-registration/eligibility-to-vote">requirements</a>:</p>
                                    <ul class="wp-block-list">
                                        <li>Be a United States citizen.</li>
                                        <li>Be age 18 or older by Election Day.</li>
                                        <li>Have resided at your current address for at least 28 days before Election Day.</li>
                                        <li>If you've been convicted of a felony, you must have completed your sentence, including probation, parole or extended supervision.</li>
                                        <li>Have not been adjudicated incompetent to vote by a judge.</li>
                                    </ul>
                                </div>
                            </section>

                            <section class="bento-section bento-section-primary ring col-span-full md:col-span-6 xl:col-span-6 xl:row-span-3">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>How do you check if you're registered?</strong></h3>
                                    <p>You can check your registration status on the MyVote Wisconsin website <a href="https://myvote.wi.gov/en-us/Register-To-Vote">here</a> by entering your name and date of birth.</p>
                                    <p>The deadline to register <a href="https://myvote.wi.gov/en-us/Register-To-Vote">online</a> or by mail is Oct. 16. The deadline to register in person at your municipal clerk's office is Nov. 1 at 5 p.m. If you haven't registered to vote before Nov. 5, don't panic. You can register to vote in person at your polling place on Election Day. You'll just need to bring an <a href="https://myvote.wi.gov/Portals/0/Documents/AcceptablePhotoIDs.pdf?ver=vS9TnMVULlI9Yi0mGe-P0g%3D%3D">accepted form of ID</a> and <a href="https://myvote.wi.gov/Portals/0/Documents/ProofOfResidence.pdf?ver=vS9TnMVULlI9Yi0mGe-P0g%3d%3d">proof of residence</a> (and meet the requirements listed above).</p>
                                </div>
                                <div class="bento-image-container">
                                    <img srcset="https://wisconsinwatch.org/wp-content/uploads/2024/11/20241105-General-Election-Voting-Timmerman-44.jpg">
                                    <figcaption><span>Stephanie Rushing, Milwaukee Election Commission election services coordinator, sorts through rejected absentee ballots on Election Day, Nov. 5, 2024, at Milwaukee Central Count at the Baird Center in Milwaukee. (Joe Timmerman / Wisconsin Watch)</span></figcaption>
                                </div>
                            </section>

                            <section class="bento-section bento-section-primary ring col-span-full md:col-span-12 xl:col-span-8 xl:row-span-2">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>Can I vote by mail?</strong></h3>
                                    <p>Yes. Wisconsin voters don't need a reason to vote by mail/be an absentee voter. Every registered Wisconsin voter has the ability to request an absentee ballot by mail. You can request an absentee ballot on MyVote Wisconsin <a href="https://myvote.wi.gov/en-us/Vote-Absentee-By-Mail">here</a>.</p>
                                    <p>Once you've submitted your request for an absentee ballot, you can track your ballot <a href="https://myvote.wi.gov/en-us/Track-My-Ballot">here</a>.</p>
                                    <p>Before you begin filling out your absentee ballot, make sure you have a witness who can verify that you filled out your own ballot. The witness needs to be an adult U.S. citizen who is not a candidate in the upcoming election. Once you've completed your ballot, place it in the certified envelope that comes with your absentee ballot. Seal and sign the certificate envelope and then have your witness sign the certificate and include the witness' address.</p>
                                    <p>The next step is to mail it back to your municipal clerk. The United States Postal Service recommends mailing your ballot back at least seven days before Election Day, according to the Wisconsin Elections Commission.</p>
                                    <p>If you're worried about your ballot being returned in time, you can deliver it to your municipal clerk's office or deliver it to your polling place on Election Day.</p>
                                </div>
                            </section>

                            <section class="bento-section bento-section-tertiary ring col-span-full md:col-span-12 xl:col-span-4 md:row-span-1">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>How do I find my polling place?</strong></h3>
                                    <p class="has-text-align-center">You can find your polling location by entering your address <a href="https://myvote.wi.gov/en-us/Find-My-Polling-Place">here</a>.</p>
                                </div>
                            </section>

                            <section class="bento-section bento-section-secondary ring col-span-full md:col-span-12 xl:col-span-4 xl:row-span-1">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>Can I put my absentee ballot in a ballot drop box?</strong></h3>
                                    <p>Yes. The Wisconsin Supreme Court recently <a href="https://wisconsinwatch.org/2024/07/wisconsin-supreme-court-allows-expanded-use-of-ballot-drop-boxes/">ruled</a> that Wisconsin communities can once again use drop boxes to collect absentee ballots. However, the use of drop boxes is not required, so it's up to your municipal clerk whether they are available in your community or not.</p>
                                </div>
                            </section>

                        </div>
                    </section>

                    
                    <!--Self populated list of stories-->
                    <!--Obtain info from "https://wisconsinwatch.org/tag/election-2026"-->

                        <h2 class="wp-block-heading has-text-align-center" id="News">Latest election news from Wisconsin Watch</h2>
                            <div class="recent-news ento-container grid grid-cols-12 grid-flow-dense gap-4" id="latest-election-2024-news-and-resources">
                                {#each data.stories as story (story.id)}
                                    <section class="bento-section bento-section-secondary ring col-span-full md:col-span-6 lg:col-span-3">
                                            {#if story.image}
                                                <figure class="post-content">
                                                    <img 
                                                        width={story.imageWidth || "782"}
                                                        height={story.imageHeight || "410"}
                                                        src={story.image}
                                                        class="attachment-rss-image-size size-rss-image-size wp-post-image"
                                                        alt={story.imageAlt || ""}
                                                        decoding="async"
                                                        loading="lazy"
                                                        srcset={story.imageSrcset || story.image}
                                                        sizes={story.imageSizes || "(max-width: 34.9rem) calc(100vw - 2rem), (max-width: 53rem) calc(8 * (100vw / 12)), (min-width: 53rem) calc(6 * (100vw / 12)), 100vw"}
                                                    />
                                                </figure>
                                            {/if}
                                            <div class="post-content">
                                                <strong><a data-post-id={story.id} id="post-title" href={story.url} style="color: #233166 !important;">
                                                    {story.title}
                                                </a></strong>
                                                {#if story.creator}
                                                    <p id="author">By <strong>{story.creator}</strong></p>
                                                {/if}
                                                {#if story.pubDate}
                                                    <p id="date">{
                                                        new Date(story.pubDate).toLocaleDateString()
                                                    }</p>
                                                {/if}
                                            </div>
                                    </section>
                                {/each}
                            </div>

                    </div>
                </div> 
        </main>
    </section>  
</div>
