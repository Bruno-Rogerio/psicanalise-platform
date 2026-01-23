import { supabase } from "@/lib/supabase-browser";

export type SenderRole = "profissional" | "cliente";

export type ChatMessage = {
  id: string;
  appointment_id: string;
  sender_id: string;
  sender_role: SenderRole;
  message: string;
  created_at: string;
};

export async function listChatMessages(
  appointmentId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, appointment_id, sender_id, sender_role, message, created_at")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendChatMessage(params: {
  appointmentId: string;
  senderRole: SenderRole;
  message: string;
}): Promise<void> {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const senderId = auth.user?.id;
  if (!senderId) throw new Error("Você precisa estar logado.");

  const { error } = await supabase.from("chat_messages").insert({
    appointment_id: params.appointmentId,
    sender_id: senderId,
    sender_role: params.senderRole,
    message: params.message,
  });

  if (error) throw error;
}
