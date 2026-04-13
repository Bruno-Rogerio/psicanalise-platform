"use client";

import Image from "next/image";
import { useState } from "react";

const STORAGE_LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/logo.jpeg`;
const FALLBACK_URL = "/logo.jpeg";

interface SiteLogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export function SiteLogo({
  width = 140,
  height = 40,
  className,
  style,
  priority = false,
}: SiteLogoProps) {
  const [src, setSrc] = useState(STORAGE_LOGO_URL);

  return (
    <Image
      src={src}
      alt="Raiza Convento Psicanálise"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={style}
      onError={() => setSrc(FALLBACK_URL)}
    />
  );
}
