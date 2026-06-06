import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  const isLegalPage =
    pathname.startsWith("/privacy") || pathname.startsWith("/consent");

  const isApiRoute = pathname.startsWith("/api/");

  const isOnboardingPage = pathname.startsWith("/onboarding");

  const isAuthCallback = pathname.startsWith("/auth/");

  if (!user && !isAuthPage && !isLegalPage && !isApiRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed")
      .eq("user_id", user.id)
      .maybeSingle();

    url.pathname =
      onboarding?.completed === false ? "/onboarding" : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    !isOnboardingPage &&
    !isAuthPage &&
    !isLegalPage &&
    !isApiRoute &&
    !isAuthCallback &&
    pathname !== "/"
  ) {
    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (onboarding?.completed === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
