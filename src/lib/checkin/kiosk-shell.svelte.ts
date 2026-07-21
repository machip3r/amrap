/** Hide ops chrome while check-in kiosk (iPad / front desk) mode is on. */
let kiosk = $state(false);

export function getCheckinKiosk() {
	return kiosk;
}

export function setCheckinKiosk(value: boolean) {
	kiosk = value;
}
