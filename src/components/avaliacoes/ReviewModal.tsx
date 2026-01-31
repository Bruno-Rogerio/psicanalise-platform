"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  professionalId: string;
  userId: string;
  userName: string;
}

export function ReviewModal({
  isOpen,
  onClose,
  appointmentId,
  professionalId,
  userId,
  userName,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      alert("Por favor, selecione uma avaliação em estrelas");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("avaliacoes").insert({
        appointment_id: appointmentId,
        profissional_id: professionalId,
        user_id: userId,
        nome: userName,
        estrelas: rating,
        comentario: comment.trim() || null,
        publicada: false, // Aguarda moderação
      });

      if (error) {
        // Se já existe avaliação para esta sessão
        if (error.code === "23505") {
          alert("Você já avaliou esta sessão!");
        } else {
          throw error;
        }
        return;
      }

      alert(
        "✅ Obrigado pela sua avaliação! Ela será publicada após aprovação.",
      );
      onClose();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b-2 border-warm-200 bg-gradient-to-r from-sage-50 to-white p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <span className="text-3xl">⭐</span>
            </div>
            <h2 className="text-2xl font-bold text-warm-900">
              Como foi sua sessão?
            </h2>
            <p className="mt-2 text-sm text-warm-600">
              Sua opinião é muito importante para nós
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stars */}
          <div>
            <label className="mb-3 block text-center text-sm font-semibold text-warm-700">
              Avalie sua experiência
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="group transition-transform hover:scale-110 active:scale-95"
                >
                  <svg
                    className={`h-12 w-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-warm-200 text-warm-200"
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-center text-sm text-warm-600">
                {rating === 5 && "Excelente! ⭐⭐⭐⭐⭐"}
                {rating === 4 && "Muito bom! ⭐⭐⭐⭐"}
                {rating === 3 && "Bom! ⭐⭐⭐"}
                {rating === 2 && "Regular ⭐⭐"}
                {rating === 1 && "Precisa melhorar ⭐"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700">
              Comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Compartilhe sua experiência..."
              className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 placeholder-warm-400 transition-all focus:border-sage-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-200"
            />
            <p className="mt-1 text-right text-xs text-warm-500">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Info */}
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Sua avaliação será analisada
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Após aprovação, ela será publicada no site com seu nome.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-4 py-3 font-semibold text-warm-700 transition-all hover:bg-warm-50 disabled:opacity-50"
            >
              Agora não
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 px-4 py-3 font-semibold text-white transition-all hover:from-sage-600 hover:to-sage-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando..." : "Enviar avaliação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
