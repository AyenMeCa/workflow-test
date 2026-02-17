const DEFAULT_PROXY_TARGET = "http://api:8000";
const CHAT_PATH = "/api/v1/assistant/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const target = (process.env.API_PROXY_TARGET || DEFAULT_PROXY_TARGET).replace(/\/$/, "");
  const url = `${target}${CHAT_PATH}`;
  const body = await req.text();
  const requestContentType = req.headers.get("content-type") || "application/json";

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": requestContentType,
      },
      body,
      cache: "no-store",
    });

    const text = await upstream.text();
    const responseContentType = upstream.headers.get("content-type") || "application/json";

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": responseContentType,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "No se pudo contactar el backend.";

    return new Response(JSON.stringify({ detail }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
