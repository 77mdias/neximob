import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { VERSAO_TERMOS_ATUAL } from "@/lib/validation";

function sanitizarProximoCaminho(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = sanitizarProximoCaminho(searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  const destination = new URL(nextPath, request.url);
  const response = NextResponse.redirect(destination);

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/entrar?erro=link_invalido", request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      return NextResponse.redirect(new URL("/entrar?erro=link_invalido", request.url));
    }
  } else {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const versaoPendente =
      typeof user.user_metadata?.termos_versao_pendente === "string" &&
      user.user_metadata.termos_versao_pendente.trim().length > 0
        ? user.user_metadata.termos_versao_pendente.trim()
        : VERSAO_TERMOS_ATUAL;

    const { data: contador } = await supabase
      .from("contadores")
      .select("termos_aceitos_em")
      .eq("id", user.id)
      .maybeSingle();

    if (contador && !contador.termos_aceitos_em) {
      await supabase.rpc("aceitar_termos", { p_versao: versaoPendente });
    }
  }

  return response;
}
