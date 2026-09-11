import Image from "next/image";

export function AzlaLogo({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      alt="AZLA"
      className={`h-auto w-[136px] ${className}`}
      height={45}
      priority={priority}
      src="/azla-logo.png"
      width={136}
    />
  );
}
