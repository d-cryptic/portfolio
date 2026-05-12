const MARKDOWN_BOT_PATTERNS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "Google-CloudVertexBot",
];

function parseAcceptHeader(header) {
  if (!header) {
    return [];
  }

  return header
    .split(",")
    .map((range) => {
      const [mediaType, ...params] = range.trim().split(";");
      const [type = "*", subtype = "*"] = mediaType.trim().split("/");
      const qualityParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qualityParam
        ? Number.parseFloat(qualityParam.split("=")[1] ?? "0")
        : 1;

      return {
        type: type.toLowerCase(),
        subtype: subtype.toLowerCase(),
        quality: Number.isFinite(quality) ? Math.max(0, Math.min(1, quality)) : 0,
      };
    })
    .sort((a, b) => b.quality - a.quality);
}

function mediaMatches(preference, type, subtype) {
  if (preference.quality <= 0) {
    return false;
  }

  const typeMatches = preference.type === "*" || preference.type === type;
  const subtypeMatches = preference.subtype === "*" || preference.subtype === subtype;

  return typeMatches && subtypeMatches;
}

function qualityFor(preferences, type, subtype) {
  const preference = preferences.find((item) => mediaMatches(item, type, subtype));
  return preference?.quality ?? 0;
}

function hasMarkdownBotUserAgent(userAgent) {
  return MARKDOWN_BOT_PATTERNS.some((pattern) => userAgent.includes(pattern));
}

function negotiateHomeResponse(request) {
  const accept = request.headers.get("accept");
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!accept) {
    return hasMarkdownBotUserAgent(userAgent) ? "markdown" : "html";
  }

  const preferences = parseAcceptHeader(accept);
  const markdownQuality = qualityFor(preferences, "text", "markdown");
  const htmlQuality = Math.max(
    qualityFor(preferences, "text", "html"),
    qualityFor(preferences, "application", "xhtml+xml"),
  );

  if (markdownQuality === 0 && htmlQuality === 0) {
    return "not-acceptable";
  }

  if (markdownQuality > htmlQuality) {
    return "markdown";
  }

  if (hasMarkdownBotUserAgent(userAgent) && markdownQuality >= htmlQuality) {
    return "markdown";
  }

  return "html";
}

function withPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;

  if (pathname !== "/" && pathname !== "/index.html") {
    return context.next();
  }

  const negotiatedResponse = negotiateHomeResponse(context.request);

  if (negotiatedResponse === "not-acceptable") {
    return new Response("Not Acceptable", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Vary": "Accept",
        "X-AEO-Version": "1.0",
      },
    });
  }

  if (negotiatedResponse === "markdown") {
    return context.env.ASSETS.fetch(withPath(context.request, "/index.md"));
  }

  return context.next();
}

export const _test = {
  negotiateHomeResponse,
  parseAcceptHeader,
};
