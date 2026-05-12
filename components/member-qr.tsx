import QRCode from "qrcode";

export async function MemberQrImage({ value }: { value: string }) {
  const src = await QRCode.toDataURL(value, {
    width: 220,
    margin: 2,
    color: { dark: "#1A1A1A", light: "#EDF2F4" },
  });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={220} height={220} className="rounded bg-[var(--color-text)] p-2" />
  );
}
