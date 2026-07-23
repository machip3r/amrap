/** Append a node to `document.body`, preserving gym brand CSS vars when the shell is branded. */
export function portal(node: HTMLElement) {
	if (document.querySelector('.amrap-branded')) {
		node.classList.add('amrap-branded');
	}
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}
