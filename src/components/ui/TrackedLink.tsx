"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  eventLabel: string;
  eventCategory?: string;
  eventName?: string;
}

export function TrackedLink({
  eventLabel,
  eventCategory = "cta",
  eventName = "cta_click",
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(eventName, eventCategory, eventLabel);
        onClick?.(e);
      }}
    />
  );
}
