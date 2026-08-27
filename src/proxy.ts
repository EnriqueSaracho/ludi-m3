import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  COUNTRY_COOKIE,
  COUNTRY_COOKIE_MAX_AGE,
  detectCountry,
} from "@/lib/country/detect";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  /* Stamp the detected region once, on the first request that arrives without
     it. Pricing is read server-side from this cookie, so doing it here means a
     logged-out visitor sees their own currency on the very next navigation
     instead of defaulting to US forever. Both pickers overwrite it. */
  if (!request.cookies.has(COUNTRY_COOKIE)) {
    response.cookies.set(COUNTRY_COOKIE, detectCountry(request.headers), {
      path: "/",
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
