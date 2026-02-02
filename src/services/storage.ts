import { supabase } from "@/lib/supabase-browser";

const BLOG_IMAGES_BUCKET = "blog-images";

// Ajuste se você quiser aceitar mais formatos
const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type ValidateResult = { valid: true } | { valid: false; error: string };

/**
 * Gera um nome de arquivo único e seguro.
 */
function buildBlogImagePath(file: File, authorId: string): string {
  // IMPORTANTE: authorId deve ser o user.id autenticado (auth.uid()).
  // A policy recomendada no Supabase valida que a primeira pasta seja o auth.uid().
  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";

  const uid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Estrutura: "<authorId>/<uid>.<ext>"
  return `${authorId}/${uid}.${ext}`;
}

/**
 * Remove querystring e fragment e retorna URL "limpa".
 */
function stripUrlParams(url: string): string {
  return url.split("#")[0].split("?")[0];
}

/**
 * Dada uma URL pública do Supabase Storage, extrai o "object path" (ex: "userId/arquivo.jpg").
 * Funciona tanto para URL no formato /object/public/... quanto /object/sign/... (se você usar no futuro).
 */
export function extractStoragePathFromPublicUrl(
  publicUrl: string,
  bucket: string = BLOG_IMAGES_BUCKET,
): string | null {
  try {
    const clean = stripUrlParams(publicUrl);

    // Exemplos comuns:
    // https://<project>.supabase.co/storage/v1/object/public/blog-images/<path>
    // https://<project>.supabase.co/storage/v1/object/sign/blog-images/<path>
    const markerPublic = `/storage/v1/object/public/${bucket}/`;
    const markerSign = `/storage/v1/object/sign/${bucket}/`;

    if (clean.includes(markerPublic))
      return clean.split(markerPublic)[1] || null;
    if (clean.includes(markerSign)) return clean.split(markerSign)[1] || null;

    // Fallback simples (caso venha em outro formato):
    const loose = `${bucket}/`;
    if (clean.includes(loose)) return clean.split(loose)[1] || null;

    return null;
  } catch {
    return null;
  }
}

/**
 * Valida se o arquivo é uma imagem válida.
 */
export function validateImageFile(file: File): ValidateResult {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Formato inválido. Use JPG, PNG, GIF ou WebP.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Imagem muito grande. Tamanho máximo: 5MB.",
    };
  }

  return { valid: true };
}

/**
 * Faz upload de uma imagem para o bucket do blog e retorna a URL pública.
 */
export async function uploadBlogImage(
  file: File,
  authorId: string,
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const filePath = buildBlogImagePath(file, authorId);

  const { error: uploadError } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  // getPublicUrl sempre retorna algo, mas por segurança:
  if (!data?.publicUrl) {
    throw new Error("Falha ao gerar URL pública da imagem.");
  }

  return data.publicUrl;
}

/**
 * Deleta imagem do blog a partir de um path (ex: "userId/arquivo.jpg").
 */
export async function deleteBlogImageByPath(filePath: string): Promise<void> {
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .remove([filePath]);

  if (error) {
    // Não joga erro para não quebrar o fluxo do post; só loga.
    console.error("Erro ao deletar imagem:", error);
  }
}

/**
 * Deleta imagem do blog a partir de uma URL pública.
 */
export async function deleteBlogImageByUrl(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  const filePath = extractStoragePathFromPublicUrl(
    imageUrl,
    BLOG_IMAGES_BUCKET,
  );
  if (!filePath) return;

  await deleteBlogImageByPath(filePath);
}

/**
 * Alias compatível com seu código atual.
 * (Mantém o nome deleteBlogImage(url))
 */
export async function deleteBlogImage(imageUrl: string): Promise<void> {
  return deleteBlogImageByUrl(imageUrl);
}
