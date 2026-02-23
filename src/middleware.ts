import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas pÃºblicas (nÃ£o precisam de autenticaÃ§Ã£o)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/recuperar",
  "/resetar-senha",
  "/auth/callback",
  "/verificar-email",
  "/acesso-negado",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/blog",
  "/api/payments/create-order/webhook",
];

// Rotas que comeÃ§am com esses prefixos sÃ£o sempre pÃºblicas
const PUBLIC_PREFIXES = [
  "/_next",
  "/api/auth",
  "/api/public",
  "/favicon",
  "/robots",
  "/sitemap",
  "/sessoes", // âš ï¸ TEMPORÃRIO
  "/api/payments/create-order/webhook",
];

function isPublicPath(pathname: string): boolean {
  // Verifica rotas exatas
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Verifica prefixos
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // Arquivos estÃ¡ticos
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$/)) {
    return true;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Rotas pÃºblicas passam direto
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

  // Verifica se usuÃ¡rio estÃ¡ autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Se nÃ£o estÃ¡ logado, redireciona para login
  if (userError || !user) {
    const loginUrl = new URL("/login", req.url);
    // Salva a URL original para redirecionar depois do login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Carrega profile uma vez (role, status, etc.)
  const { data: baseProfile } = await supabase
    .from("profiles")
    .select("role,status,email_verified_at,deleted_at")
    .eq("id", user.id)
    .single();

  // Bloqueado ou deletado
  if (baseProfile?.status === "blocked" || baseProfile?.deleted_at) {
    return NextResponse.redirect(new URL("/acesso-negado", req.url));
  }

  // Precisa verificar email
  const needsEmailVerification =
    !baseProfile?.email_verified_at || baseProfile?.status === "pending_email";

  const isVerificationPath =
    pathname.startsWith("/verificar-email") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/logout");

  if (needsEmailVerification && !isVerificationPath) {
    const url = new URL("/verificar-email", req.url);
    const email = user.email || "";
    if (email) url.searchParams.set("email", email);
    return NextResponse.redirect(url);
  }

  // ProteÃ§Ã£o de rotas por role
  if (pathname.startsWith("/profissional") || pathname.startsWith("/admin")) {
    const profile = baseProfile;

    // Se nÃ£o Ã© profissional, redireciona para dashboard do cliente
    if (profile?.role !== "profissional") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Se Ã© profissional tentando acessar Ã¡rea de cliente, redireciona
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/minhas-sessoes") ||
    pathname.startsWith("/agendar")
  ) {
    const profile = baseProfile;

    // Se Ã© profissional, redireciona para Ã¡rea do profissional
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

