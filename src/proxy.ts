import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

const ROTAS_AUTENTICACAO = new Set([
  "/entrar",
  "/criar-conta",
  "/esqueci-senha",
]);

const ROTAS_PUBLICAS_LIVRES = new Set([
  "/auth/callback",
  "/confirmar-email",
  "/nova-senha",
  "/termos",
  "/privacidade",
]);

const PREFIXOS_ESTATICOS = [
  "/_next",
  "/fonts",
  "/brand",
  "/favicon",
  "/icon",
];

function eArquivoEstatico(pathname: string): boolean {
  if (PREFIXOS_ESTATICOS.some((prefixo) => pathname.startsWith(prefixo))) {
    return true;
  }

  return (
    pathname === "/site.webmanifest" ||
    pathname === "/og-image.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

/** Atualiza cookies de sessão do Supabase SSR e protege as rotas privadas. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (eArquivoEstatico(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({
          request,
        });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (ROTAS_PUBLICAS_LIVRES.has(pathname)) {
    return response;
  }

  const rotaProtegida =
    pathname === "/" || pathname.startsWith("/primeiros-passos");

  if (!user && rotaProtegida) {
    const urlDestino = request.nextUrl.clone();
    urlDestino.pathname = "/entrar";
    urlDestino.search = "";
    const redirectResponse = NextResponse.redirect(urlDestino);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  if (user && ROTAS_AUTENTICACAO.has(pathname)) {
    const urlDestino = request.nextUrl.clone();
    urlDestino.pathname = "/";
    urlDestino.search = "";
    const redirectResponse = NextResponse.redirect(urlDestino);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|ico)$).*)",
  ],
};
