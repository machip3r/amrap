import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'amrap-theme';

function getStoredTheme(): Theme | null {
	if (!browser) return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : null;
}

function getSystemTheme(): Theme {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(): Theme {
	return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme) {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

function setTheme(theme: Theme) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
}

export function toggleTheme(current: Theme): Theme {
	const next = current === 'dark' ? 'light' : 'dark';
	setTheme(next);
	return next;
}

export function initTheme() {
	applyTheme(resolveTheme());
}
