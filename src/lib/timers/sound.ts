/** Timer cue sound — MP3 + unlock for iOS Safari / PWA autoplay policy. */

export type TimerBeepKind = "start" | "interval" | "rest" | "end";

const BELL_SRC = "/sounds/hector-bell.mp3";

let shared: HTMLAudioElement | null = null;
let unlocked = false;
let unlocking = false;

function createBell(): HTMLAudioElement {
	const audio = new Audio(BELL_SRC);
	audio.preload = "auto";
	audio.setAttribute("playsinline", "true");
	(audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
	return audio;
}

function getShared(): HTMLAudioElement {
	if (!shared) shared = createBell();
	return shared;
}

/**
 * Call from a user gesture (Start / unmute) so later programmatic plays
 * are allowed on iOS Safari and installed PWAs.
 */
export function unlockTimerAudio(): void {
	if (typeof window === "undefined" || unlocked || unlocking) return;
	try {
		unlocking = true;
		const audio = getShared();
		const prevMuted = audio.muted;
		const prevVolume = audio.volume;
		audio.muted = true;
		audio.volume = 0;
		const playPromise = audio.play();
		const finish = (ok: boolean) => {
			audio.pause();
			try {
				audio.currentTime = 0;
			} catch {
				/* ignore */
			}
			audio.muted = prevMuted;
			audio.volume = prevVolume > 0 ? prevVolume : 1;
			unlocking = false;
			if (ok) unlocked = true;
		};
		if (playPromise !== undefined) {
			void playPromise.then(() => finish(true)).catch(() => finish(false));
		} else {
			finish(true);
		}
	} catch {
		unlocking = false;
	}
}

function volumeFor(kind: TimerBeepKind): number {
	if (kind === "interval") return 0.8;
	if (kind === "rest") return 0.9;
	return 1;
}

function playOn(audio: HTMLAudioElement, volume: number): void {
	audio.pause();
	try {
		audio.currentTime = 0;
	} catch {
		/* ignore */
	}
	audio.volume = volume;
	audio.muted = false;
	void audio.play().catch(() => {});
}

/** Fire one bell; clones so a second strike can overlap shortly after. */
function playOnce(volume: number): void {
	const base = getShared();
	const clip = base.cloneNode(true) as HTMLAudioElement;
	clip.setAttribute("playsinline", "true");
	(clip as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
	clip.volume = volume;
	clip.muted = false;
	const playClone = clip.play();
	if (playClone !== undefined) {
		void playClone
			.then(() => {
				unlocked = true;
			})
			.catch(() => {
				playOn(base, volume);
				unlocked = true;
			});
	} else {
		playOn(base, volume);
		unlocked = true;
	}
}

export function playBeep(kind: TimerBeepKind, muted: boolean): void {
	if (muted || typeof window === "undefined") return;
	try {
		const vol = volumeFor(kind);
		// Start / end: double strike (matches previous oscillator cues).
		// Interval / rest: single strike when the phase changes.
		playOnce(vol);
		if (kind === "start" || kind === "end") {
			window.setTimeout(() => playOnce(vol * 0.95), 380);
		}
	} catch {
		/* ignore */
	}
}

