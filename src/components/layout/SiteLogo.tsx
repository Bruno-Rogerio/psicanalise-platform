"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const STORAGE_LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/logo.jpeg`;
const FALLBACK_URL = "/logo.jpeg";
const LS_KEY = "logo_v";

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

  useEffect(() => {
    const v = localStorage.getItem(LS_KEY);
    if (v) setSrc(`${STORAGE_LOGO_URL}?v=${v}`);
  }, []);

  return (
    <Image
      src={src}
      alt="Raiza Convento Psicanálise"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={style}
      unoptimized
      onError={() => setSrc(FALLBACK_URL)}
    />
  );
}
