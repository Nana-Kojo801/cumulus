export interface Env {
  // Bindings can be specified here
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const canvasDomain = url.searchParams.get("ashesi.instructure.com");

    if (!canvasDomain) {
      return new Response("Missing domain parameter", { status: 400 });
    }

    const targetUrl = `https://${canvasDomain}${url.pathname.replace("/proxy", "")}${url.search}`;

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
        "Access-Control-Allow-Origin": "https://ashesi-cumulus.netlify.app", // your app's domain in production
        "Content-Type": "application/json",
      },
    });
  }
} satisfies ExportedHandler<Env>;