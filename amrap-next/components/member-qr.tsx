import QRCode from "qrcode";

export async function MemberQrImage({ value }: { value: string }) {
  const src = await QRCode.toDataURL(value, {
    width: 200,
    margin: 2,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={200}
      height={200}
      className="rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-sm"
    />
  );
}
