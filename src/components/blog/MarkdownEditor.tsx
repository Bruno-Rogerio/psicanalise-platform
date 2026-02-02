'use client';

import { useState } from 'react';
import { BlogContent } from './BlogContent';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Escreva seu conteúdo aqui usando Markdown...',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const helpText = `
**Dicas de formatação:**
- **Negrito**: **texto**
- *Itálico*: *texto*
- # Título grande
- ## Subtítulo
- > Citação em destaque
- Lista: - item
- Link: [texto](url)
- Imagem: ![descrição](url)
- Vídeo YouTube/Vimeo: ![vídeo](url do vídeo)
  `.trim();

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-warm-200 bg-white">
      {/* Tabs */}
      <div className="flex border-b border-warm-200 bg-warm-50">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'bg-white text-warm-900'
              : 'text-warm-600 hover:text-warm-900'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-white text-warm-900'
              : 'text-warm-600 hover:text-warm-900'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visualizar
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'edit' ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={20}
            className="w-full resize-none p-4 font-mono text-sm text-warm-800 placeholder-warm-400 focus:outline-none"
          />

          {/* Help tooltip */}
          <div className="absolute bottom-4 right-4">
            <div className="group relative">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-100 text-warm-500 transition-colors hover:bg-warm-200 hover:text-warm-700"
                aria-label="Ajuda de formatação"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Tooltip */}
              <div className="invisible absolute bottom-full right-0 z-10 mb-2 w-72 rounded-xl border border-warm-200 bg-white p-4 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                <pre className="whitespace-pre-wrap text-xs text-warm-700">
                  {helpText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[400px] p-6">
          {value ? (
            <BlogContent content={value} />
          ) : (
            <p className="text-center text-warm-400">
              Nenhum conteúdo para visualizar
            </p>
          )}
        </div>
      )}
    </div>
  );
}
