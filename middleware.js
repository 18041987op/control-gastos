import { rewrite, next } from "@vercel/edge";

export const config = {
  matcher: "/((?!_next|_vercel|api|favicon\\.ico).*)",
};

export default function middleware(request) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const url = new URL(request.url);

  if (host === "duplex.osmanventures.io" && !url.pathname.startsWith("/duplex")) {
    const dest = url.pathname === "/" ? "/duplex/index.html" : "/duplex" + url.pathname;
    return rewrite(new URL(dest + url.search, request.url));
  }

  return next();
}
