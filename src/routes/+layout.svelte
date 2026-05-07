<script>
	import favicon from '$lib/assets/favicon.webp';
	import stylizedBkg from '$lib/assets/stylized-bkg.png';
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import navMenu from '$lib/navMenu.js';
	
	let { children } = $props();
	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	onMount(() => {
		navMenu.init();
	});

	let _destroyHoverTooltip = null;

	onMount(() => {
		// initialize global hover-tooltip for elements with class "hover-tooltip"
		import('$lib/hoverTooltip.js').then(mod => {
			_destroyHoverTooltip = mod.initHoverTooltip({ offset: 12, showClass: 'hover-tooltip' });
		}).catch(() => {});
	});

	onDestroy(() => {
		if (typeof _destroyHoverTooltip === 'function') _destroyHoverTooltip();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
	<link rel="stylesheet" href="{base}/css/wp-custom.css">
	<link rel="stylesheet" href="{base}/css/drop-nav.css">
</svelte:head>

<header id="masthead" class="site-header hide-header-search">			
	<div class="middle-header-contain">
		<div class="wrapper">			
			<div class="site-branding">
				<style>.site-header .custom-logo{height:auto;max-height:90px;max-width:320px;width:auto;}@media (max-width: 781px){.site-header .custom-logo{max-width:175px;max-height:56px;}}@media (min-width: 782px){.h-stk:not(.h-sub) .site-header .custom-logo{max-height:90px;max-width:320px;}.h-sub .site-header .custom-logo{max-width:220px;max-height:70px;}}@media (max-width: 1199px) and (min-width: 782px){.h-stk.h-cl:not(.h-sub) .site-header .custom-logo{max-width: 100%;width: auto;}}</style><a href="https://wisconsinwatch.org/" class="custom-logo-link" rel="home" aria-current="page"><img width="700" height="223" src="https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?fit=700%2C223&amp;quality=100&amp;ssl=1" class="custom-logo" alt="Wisconsin Watch" decoding="async" fetchpriority="high" srcset="https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?w=700&amp;quality=100&amp;ssl=1 700w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=336%2C107&amp;quality=100&amp;ssl=1 336w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=140%2C45&amp;quality=100&amp;ssl=1 140w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=400%2C127&amp;quality=100&amp;ssl=1 400w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=150%2C48&amp;quality=100&amp;ssl=1 150w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?fit=700%2C223&amp;quality=100&amp;ssl=1&amp;w=370 370w" sizes="(max-width: 700px) 100vw, 700px"></a>
				<div class="site-identity">			
					<p class="site-description">Nonprofit, nonpartisan news about Wisconsin</p>
				</div><!-- .site-identity -->
			</div><!-- .site-branding -->
			<button class="menu-icon hover-tooltip" data-tooltip="Navigation" onclick={toggleMenu} aria-label="Toggle menu">
				<img src="{base}/graphics/menu.svg" alt="Menu" />
			</button>
		</div><!-- .wrapper -->
	</div><!-- .middle-header-contain -->

</header>

<!-- Navigation Menu Slide-in Panel -->
<div 
	class="nav-menu-overlay" 
	class:open={menuOpen} 
	onclick={toggleMenu}
	onkeydown={(e) => e.key === 'Enter' && toggleMenu()}
	role="button"
	tabindex="0"
	aria-label="Close menu overlay"
></div>
<div id="nav-menu" class="nav-menu" class:open={menuOpen}>
	<div class="nav-menu-header">
		<h2>Know your race?</h2>
		<button class="close-btn" onclick={toggleMenu} aria-label="Close menu">✕</button>
	</div>
	
	<div class="nav-menu-content">
		<!-- Race Search Section -->
		<div class="search-section">
			<h3>Search for a race</h3>
			<div class="search-input-group">
				<select id="race-type-select" aria-label="Race type" required>
					<option value="">Select race type...</option>
				</select>
			</div>
			<div class="search-input-group" id="district-select-group" style="display: none;">
				<select id="district-select" aria-label="District" required>
					<option value="">Select district...</option>
				</select>
			</div>
			<button id="race-search-btn" class="search-btn" style="display: none;">Go to Race</button>
		</div>
	</div>
</div>

<div style="min-height: 100vh; background-image: url('{stylizedBkg}'); background-size: contain; background-position: bottom center; background-repeat: no-repeat; background-attachment: scroll">
	{@render children()}
</div>	

<footer style="background-color: #eee; padding: 1rem 0.5rem">
	<div class="footer-branding" style="padding-bottom: 1rem;">
		<div class="wrapper">
		<style>.site-header .custom-logo{height:auto;max-height:90px;max-width:320px;width:auto;}@media (max-width: 781px){.site-header .custom-logo{max-width:175px;max-height:56px;}}@media (min-width: 782px){.h-stk:not(.h-sub) .site-header .custom-logo{max-height:90px;max-width:320px;}.h-sub .site-header .custom-logo{max-width:220px;max-height:70px;}}@media (max-width: 1199px) and (min-width: 782px){.h-stk.h-cl:not(.h-sub) .site-header .custom-logo{max-width: 100%;width: auto;}}</style><a href="https://wisconsinwatch.org/" class="custom-logo-link" rel="home"><img width="700" height="223" src="https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?fit=700%2C223&amp;quality=100&amp;ssl=1" class="custom-logo" alt="Wisconsin Watch" decoding="async" srcset="https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?w=700&amp;quality=100&amp;ssl=1 700w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=336%2C107&amp;quality=100&amp;ssl=1 336w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=140%2C45&amp;quality=100&amp;ssl=1 140w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=400%2C127&amp;quality=100&amp;ssl=1 400w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?resize=150%2C48&amp;quality=100&amp;ssl=1 150w, https://i0.wp.com/wisconsinwatch.org/wp-content/uploads/2021/06/ww-logo-footer.png?fit=700%2C223&amp;quality=100&amp;ssl=1&amp;w=370 370w" sizes="(max-width: 700px) 100vw, 700px"></a>	<nav class="social-navigation" aria-label="Social Links Menu">
		<ul id="menu-social-links-menu-2" class="social-links-menu"><li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-1300938"><a href="https://bsky.app/profile/wisconsinwatch.org"><span class="screen-reader-text">Bsky</span><svg class="svg-icon" width="0" height="0" aria-hidden="true" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.33525 4.1443C8.6282 5.80613 11.0944 9.17571 12 10.9838C12.9056 9.17571 15.3718 5.80613 17.6648 4.1443C19.3192 2.94521 22 2.01741 22 4.96972C22 5.55931 21.6498 9.92278 21.4444 10.6312C20.7305 13.0941 18.1291 13.7222 15.815 13.342C19.8599 14.0066 20.8889 16.2079 18.6667 18.4093C14.4462 22.59 12.6007 17.3603 12.1279 16.0203C12.0412 15.7746 12.0006 15.6597 12 15.7574C11.9994 15.6597 11.9588 15.7746 11.8721 16.0203C11.3993 17.3603 9.55377 22.59 5.33333 18.4093C3.11111 16.2079 4.14006 14.0066 8.18496 13.342C5.87088 13.7222 3.26949 13.0941 2.55556 10.6312C2.35018 9.92278 2 5.55931 2 4.96972C2 2.01741 4.68079 2.94521 6.33525 4.1443Z"></path></svg></a></li>
		<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-1302193"><a href="https://x.com/wisconsinwatch"><span class="screen-reader-text">Twitter</span><svg class="svg-icon" width="0" height="0" aria-hidden="true" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.5222 10.7714L19.4785 4H18.0671L12.8952 9.87954L8.76437 4H4L10.2466 12.8909L4 19.9918H5.41155L10.8732 13.7828L15.2356 19.9918H20L13.5218 10.7714H13.5222ZM11.5889 12.9692L10.956 12.0839L5.92015 5.03921H8.0882L12.1522 10.7245L12.7851 11.6098L18.0677 18.9998H15.8997L11.5889 12.9696V12.9692Z"></path></svg></a></li>
		<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-1303665"><a href="https://www.tiktok.com/@wisconsinwatch"><span class="screen-reader-text">TikTok</span><svg class="svg-icon" width="0" height="0" aria-hidden="true" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.3,10.1c-0.2,0-0.3,0-0.5,0c-1.8,0-3.4-0.9-4.4-2.4c0,3.7,0,7.9,0,8c0,3.3-2.6,5.9-5.9,5.9s-5.9-2.6-5.9-5.9s2.6-5.9,5.9-5.9c0.1,0,0.2,0,0.4,0v2.9c-0.1,0-0.2,0-0.4,0c-1.7,0-3,1.4-3,3s1.4,3,3,3s3.1-1.3,3.1-3c0-0.1,0-13.6,0-13.6h2.8c0.3,2.5,2.3,4.5,4.8,4.6V10.1z"></path></svg></a></li>
		<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-1300738"><a href="https://www.youtube.com/@WisWatchVideos"><span class="screen-reader-text">YouTube</span><svg class="svg-icon" width="0" height="0" aria-hidden="true" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.8,8.001c0,0-0.195-1.378-0.795-1.985c-0.76-0.797-1.613-0.801-2.004-0.847c-2.799-0.202-6.997-0.202-6.997-0.202 h-0.009c0,0-4.198,0-6.997,0.202C4.608,5.216,3.756,5.22,2.995,6.016C2.395,6.623,2.2,8.001,2.2,8.001S2,9.62,2,11.238v1.517 c0,1.618,0.2,3.237,0.2,3.237s0.195,1.378,0.795,1.985c0.761,0.797,1.76,0.771,2.205,0.855c1.6,0.153,6.8,0.201,6.8,0.201 s4.203-0.006,7.001-0.209c0.391-0.047,1.243-0.051,2.004-0.847c0.6-0.607,0.795-1.985,0.795-1.985s0.2-1.618,0.2-3.237v-1.517 C22,9.62,21.8,8.001,21.8,8.001z M9.935,14.594l-0.001-5.62l5.404,2.82L9.935,14.594z"></path></svg></a></li>
		<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-1260221"><a href="https://www.facebook.com/wisconsinwatch"><span class="screen-reader-text">Facebook</span><svg class="svg-icon" width="0" height="0" aria-hidden="true" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"></path></svg></a></li>
		<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-1260223"><a href="https://www.instagram.com/wisconsinwatch/"><span class="screen-reader-text">Instagram</span><svg class="svg-icon" width="0" height="0" aria-hidden="true" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673 c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637 s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035 c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052 s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673 c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12 s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035 c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3 C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511 c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711 c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038 c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418 c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185 C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594 c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378 c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15 c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08 s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z"></path></svg></a></li>
		</ul>	</nav><!-- .social-navigation -->
		</div><!-- .wrapper -->
	</div>
	<div class="site-info">			
		<div class="wrapper site-info-contain">
			<span class="copyright">© {new Date().getFullYear()} Wisconsin Watch. All rights reserved.</span>				
			<a class="privacy-policy-link" href="https://wisconsinwatch.org/about/user-agreement-and-privacy-policy/" rel="privacy-policy">User Agreement and Privacy Policy</a>			
		</div><!-- .wrapper -->
	</div>
</footer>

