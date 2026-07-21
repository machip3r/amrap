/** Shared flag: hide ops chrome while a timer run/edit session is open. */
let immersive = $state(false);

export function getTimersImmersive() {
	return immersive;
}

export function setTimersImmersive(value: boolean) {
	immersive = value;
}
