<script lang="ts">
	import { navigating } from '$app/stores';
</script>

{#if $navigating}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-[var(--color-border)]/40"
		role="progressbar"
		aria-hidden="true"
	>
		<div
			class="amrap-nav-progress h-full w-1/3 bg-[var(--color-primary)]"
		></div>
	</div>
{/if}

<style>
	@keyframes amrap-nav-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(400%);
		}
	}

	.amrap-nav-progress {
		animation: amrap-nav-slide 1.1s ease-in-out infinite;
	}
</style>
