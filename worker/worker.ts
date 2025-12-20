export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const arxivUrl =
      "https://arxiv.org/api/query" + url.search;

    const res = await fetch(arxivUrl);

    return new Response(await res.text(), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};