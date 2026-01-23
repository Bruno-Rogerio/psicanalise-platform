"use client";

import type { AppointmentType } from "@/services/agenda";

export function TypeToggle({
  value,
  onChange,
}: {
  value: AppointmentType;
  onChange: (v: AppointmentType) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-[#D6DED9] bg-white/70 p-1 backdrop-blur">
      <button
        onClick={() => onChange("video")}
        className={[
          "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition",
          value === "video"
            ? "bg-[#111111] text-white"
            : "text-[#36413A] hover:bg-white/80",
        ].join(" ")}
      >
        Vídeo
      </button>
      <button
        onClick={() => onChange("chat")}
        className={[
          "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition",
          value === "chat"
            ? "bg-[#111111] text-white"
            : "text-[#36413A] hover:bg-white/80",
        ].join(" ")}
      >
        Chat
      </button>
    </div>
  );
}
