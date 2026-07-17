<script lang="ts">
	let { children, data } = $props();
</script>

<div lang={data.locale}>
	{@render children()}
</div>
