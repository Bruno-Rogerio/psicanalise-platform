import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas públicas (não precisam de autenticação)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/recuperar",
  "/resetar-senha",
  "/auth/callback",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/blog",
  "/api/payments/webhook",
];

// Rotas que começam com esses prefixos são sempre públicas
const PUBLIC_PREFIXES = [
  "/_next",
  "/api/public",
  "/favicon",
  "/robots",
  "/sitemap",
  "/sessoes", // ⚠️ TEMPORÁRIO
];

function isPublicPath(pathname: string): boolean {
  // Verifica rotas exatas
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Verifica prefixos
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // Arquivos estáticos
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$/)) {
    return true;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Rotas públicas passam direto
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Cria response para poder setar cookies
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Cria cliente Supabase com cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Seta no request para o server component
          req.cookies.set({ name, value, ...options });
          // Seta no response para o browser
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // Verifica se usuário está autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Se não está logado, redireciona para login
  if (userError || !user) {
    const loginUrl = new URL("/login", req.url);
    // Salva a URL original para redirecionar depois do login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteção de rotas por role
  if (pathname.startsWith("/profissional") || pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Se não é profissional, redireciona para dashboard do cliente
    if (profile?.role !== "profissional") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Se é profissional tentando acessar área de cliente, redireciona
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/minhas-sessoes") ||
    pathname.startsWith("/agendar")
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Se é profissional, redireciona para área do profissional
    if (profile?.role === "profissional") {
      return NextResponse.redirect(new URL("/profissional/agenda", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
