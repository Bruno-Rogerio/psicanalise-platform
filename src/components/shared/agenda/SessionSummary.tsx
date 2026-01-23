import type { Slot } from "@/services/agenda";

export function SessionSummary({ slot }: { slot: Slot }) {
  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-[#111111]">Sua sessão</p>

      <div className="mt-2 space-y-1 text-sm text-[#36413A]">
        <p>
          <strong>Tipo:</strong>{" "}
          {slot.appointment_type === "video" ? "Vídeo" : "Chat"}
        </p>
        <p>
          <strong>Data:</strong>{" "}
          {slot.start.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>
        <p>
          <strong>Horário:</strong>{" "}
          {slot.start.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
