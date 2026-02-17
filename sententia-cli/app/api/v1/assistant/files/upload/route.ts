const DEFAULT_PROXY_TARGET = "http://api:8000";
const UPLOAD_PATH = "/api/v1/assistant/files/upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const target = (process.env.API_PROXY_TARGET || DEFAULT_PROXY_TARGET).replace(/\/$/, "");
  const url = `${target}${UPLOAD_PATH}`;
  const contentType = req.headers.get("content-type") || "";
  const requestId = req.headers.get("x-request-id");
  const headers = new Headers();

  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }

  try {
    const body = contentType.includes("multipart/form-data")
      ? await req.formData()
      : await req.text();

    if (typeof body === "string" && contentType) {
      headers.set("Content-Type", contentType);
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers,
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
