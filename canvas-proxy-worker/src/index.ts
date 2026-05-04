export interface Env {
  // Bindings can be specified here
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://ashesi-cumulus.netlify.app",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Expose-Headers": "Link",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    
    // Proxy directly to Ashesi Canvas
    const canvasDomain = "ashesi.instructure.com";
    const targetPath = url.pathname.replace("/proxy", "");
    const targetUrl = `https://${canvasDomain}${targetPath}${url.search}`;

    const headers = new Headers();
    const auth = request.headers.get("Authorization");
    if (auth) {
      headers.set("Authorization", auth);
    }
    headers.set("Content-Type", "application/json");

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Link": response.headers.get("Link") || "",
      },
    });
  }
} satisfies ExportedHandler<Env>;