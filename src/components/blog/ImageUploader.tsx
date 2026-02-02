'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { uploadBlogImage, validateImageFile, deleteBlogImage } from '@/services/storage';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  authorId: string;
}

export function ImageUploader({ value, onChange, authorId }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido');
        return;
      }

      try {
        setIsUploading(true);

        // Se já tem uma imagem, deleta a anterior
        if (value) {
          await deleteBlogImage(value);
        }

        const url = await uploadBlogImage(file, authorId);
        onChange(url);
      } catch (err) {
        console.error('Erro no upload:', err);
        setError('Erro ao fazer upload da imagem');
      } finally {
        setIsUploading(false);
      }
    },
    [authorId, onChange, value]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      try {
        await deleteBlogImage(value);
      } catch {
        // Ignora erro ao deletar
      }
      onChange(null);
    }
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-warm-700">
        Imagem de capa (opcional)
      </label>

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-warm-200">
          <div className="relative aspect-[16/9]">
            <Image
              src={value}
              alt="Imagem de capa"
              fill
              className="object-cover"
            />
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-rose-700"
            aria-label="Remover imagem"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? 'border-sage-400 bg-sage-50'
              : 'border-warm-300 bg-warm-50 hover:border-warm-400 hover:bg-warm-100'
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleChange}
            disabled={isUploading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />

          {isUploading ? (
            <>
              <svg
                className="h-10 w-10 animate-spin text-sage-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="mt-2 text-sm text-warm-600">Enviando...</p>
            </>
          ) : (
            <>
              <svg
                className="h-10 w-10 text-warm-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium text-warm-700">
                Clique ou arraste uma imagem
              </p>
              <p className="mt-1 text-xs text-warm-500">
                JPG, PNG, GIF ou WebP • Máximo 5MB
              </p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
