<script lang="ts">
	import './layout.css';

	let { children } = $props();

	const themeInit = `
		(function () {
			try {
				var stored = localStorage.getItem('amrap-theme');
				var theme = stored === 'light' || stored === 'dark'
					? stored
					: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
				document.documentElement.classList.toggle('dark', theme === 'dark');
			} catch (e) {}
		})();
	`;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	{@html `<script>${themeInit}<\/script>`}
</svelte:head>

{@render children()}
