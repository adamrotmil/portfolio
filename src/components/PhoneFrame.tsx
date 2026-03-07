export default function PhoneFrame({
  src,
  alt = "Mobile screen",
}: {
  src: string;
  alt?: string;
}) {
  return (
    <div className="bg-[#1c1c1e] rounded-[44px] p-[10px] shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
      <div className="rounded-[36px] overflow-hidden bg-white">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}
