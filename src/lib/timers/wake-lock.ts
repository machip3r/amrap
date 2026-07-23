/** Keep the screen awake while the user is on timers (workout-friendly). */

type WakeLockSentinelLike = {
	released: boolean;
	release: () => Promise<void>;
	addEventListener: (type: 'release', listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
	wakeLock?: {
		request: (type: 'screen') => Promise<WakeLockSentinelLike>;
	};
};

let sentinel: WakeLockSentinelLike | null = null;

export async function requestTimerWakeLock(): Promise<void> {
	if (typeof navigator === 'undefined') return;
	const wl = (navigator as WakeLockNavigator).wakeLock;
	if (!wl) return;
	try {
		if (sentinel && !sentinel.released) return;
		sentinel = await wl.request('screen');
		sentinel.addEventListener('release', () => {
			sentinel = null;
		});
	} catch {
		/* unsupported, denied, low power, etc. */
		sentinel = null;
	}
}

export async function releaseTimerWakeLock(): Promise<void> {
	const current = sentinel;
	sentinel = null;
	if (!current || current.released) return;
	try {
		await current.release();
	} catch {
		/* ignore */
	}
}

/**
 * Request a screen wake lock for the lifetime of the timers surface.
 * Re-requests when the tab becomes visible again (OS releases lock on hide).
 */
export function attachTimerWakeLockLifecycle(): () => void {
	if (typeof document === 'undefined') return () => {};

	void requestTimerWakeLock();

	const onVisibility = () => {
		if (document.visibilityState === 'visible') {
			void requestTimerWakeLock();
		}
	};
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		document.removeEventListener('visibilitychange', onVisibility);
		void releaseTimerWakeLock();
	};
}
