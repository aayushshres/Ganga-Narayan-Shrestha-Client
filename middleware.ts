import { next } from "@vercel/edge";

// Crawlers (Twitter/X, Substack, Facebook, Slack, WhatsApp, …) don't run JS,
// so for article/book links they only see the static SPA shell with no
// per-page Open Graph tags. This Edge Middleware intercepts those URLs for
// crawlers and returns the server-rendered, OG-tagged HTML (which the Render
// backend already produces), while real visitors pass straight through.

export const config = {
  matcher: ["/articles/:id", "/books/:id"],
};

// Origin of the Express backend that serves the prerendered OG HTML.
const PRERENDER_ORIGIN =
  "https://ganga-narayan-shrestha-portfolio-server.onrender.com";

const CRAWLERS = [
  "facebookexternalhit",
  "facebookcatalog",
  "twitterbot",
  "whatsapp",
  "telegrambot",
  "linkedinbot",
  "slackbot",
  "slack-imgproxy",
  "discordbot",
  "discord",
  "googlebot",
  "google-inspectiontool",
  "bingbot",
  "redditbot",
  "pinterest",
  "vkshare",
  "embedly",
  "quora link preview",
  "skypeuripreview",
  "nuzzel",
  "bitlybot",
  "flipboard",
  "applebot",
];

export default async function middleware(request: Request) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const isCrawler = CRAWLERS.some((c) => ua.includes(c));
  if (!isCrawler) return next(); // real visitor → normal SPA

  const { pathname } = new URL(request.url);
  try {
    const upstream = await fetch(PRERENDER_ORIGIN + pathname, {
      headers: {
        "user-agent": request.headers.get("user-agent") || "facebookexternalhit",
      },
    });
    if (!upstream.ok) return next();
    const html = await upstream.text();
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch {
    return next(); // backend unreachable → fall back to the SPA
  }
}
