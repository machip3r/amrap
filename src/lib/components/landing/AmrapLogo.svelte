<script lang="ts">
	type Props = {
		class?: string;
	};

	let { class: className = 'h-9 w-auto' }: Props = $props();
</script>

<span class="relative inline-flex items-center justify-center {className}">
	<img
		src="/amrap-black-logo.png"
		alt="AMRAP"
		width="120"
		height="32"
		class="h-full w-auto max-w-none object-contain dark:hidden"
	/>
	<img
		src="/amrap-white-logo.png"
		alt=""
		width="120"
		height="32"
		aria-hidden="true"
		class="hidden h-full w-auto max-w-none object-contain dark:block"
	/>
</span>
