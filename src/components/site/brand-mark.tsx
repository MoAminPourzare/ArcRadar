import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function BrandMark({
  className,
  priority = false,
  sizes = "40px",
}: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block size-10 shrink-0 overflow-hidden rounded-lg bg-[#02071a] ring-1 ring-ink/10",
        className,
      )}
    >
      <Image
        alt=""
        className="object-cover"
        fill
        priority={priority}
        sizes={sizes}
        src="/brand/arcradar-mark.png"
      />
    </span>
  );
}
