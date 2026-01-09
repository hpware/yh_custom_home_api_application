Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path === "/light") {
      const searchParams = url.searchParams;
      const all = searchParams.get("all");
      const state = searchParams.get("state");
      const req = await fetch(`${process.env.HOME_ASSISTANT_URL}/api/light`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_id: all === "1" ? "light.all" : "light.living_room",
          state: state === "1" ? "on" : "off",
        }),
      });
      return Response.json({});
    }
    return new Response("Hello via Bun!");
  },
});
