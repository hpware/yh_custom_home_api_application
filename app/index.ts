import { setHomeAssistantData, getHomeAssistantData } from "./homeAssistant";
if (process.env.SERVICE_REQUIRED_API_TOKEN === null) {
  throw new Error("SERVICE_REQUIRED_API_TOKEN is not set in .env");
}
console.log("Service using port :3000");

Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      const path = url.pathname;
      const headers = req.headers;
      const bearer = headers.get("Authorization");
      if (
        !(
          bearer &&
          bearer.includes("Bearer ") &&
          bearer.replace("Bearer ", "") ===
            process.env.SERVICE_REQUIRED_API_TOKEN
        )
      ) {
        return Response.json({
          error: "401 Unauthorized",
        });
      }
      if (path.startsWith("/ha/get/")) {
        const [, slug] = url.pathname.split("/").slice(2);
        if (!slug) {
          return Response.json({
            error: "incorrect params",
          });
        }
        const res = await getHomeAssistantData(slug);
        return Response.json(res);
      } else if (path === "/batch/ha/get" && req.method === "POST") {
        const body = (await req.json()) as any;
        if (!body.devices) {
          return Response.json({
            error: "incorrect params",
          });
        }
        const getAllDeviceInfo = await Promise.all(
          body.devices.map(async (device: string) => {
            const res = await getHomeAssistantData(device);
            return res;
          }),
        );
        return Response.json(getAllDeviceInfo);
      } else if (path.startsWith("/ha/set/") && req.method === "POST") {
        try {
          const body = (await req.json()) as any;
          const device = path.split("/")[3]; // e.g., "light.living_room"

          if (!device) {
            return new Response("Device entity ID is required", {
              status: 400,
            });
          }

          const state = String(body.state).toLowerCase();
          const res = await setHomeAssistantData(device, state);
          return Response.json(res);
        } catch (err) {
          return new Response(
            err instanceof Error ? err.message : "Internal Error",
            {
              status: 500,
            },
          );
        }
      } else if (path === "/batch/ha/set" && req.method === "POST") {
        try {
          const body = (await req.json()) as any;
          const devices = body.devices as string[];
          const state = body.state;

          if (!devices || !state) {
            return new Response("invalid params", {
              status: 400,
            });
          }

          const results = await Promise.all(
            devices.map(
              async (device, index) =>
                await setHomeAssistantData(device, state),
            ),
          );
          return Response.json(results);
        } catch (err) {
          return new Response(
            err instanceof Error ? err.message : "Internal Error",
            {
              status: 500,
            },
          );
        }
      }
      return Response.json({
        error: "404 Route not found",
      });
    } catch (e) {
      console.error(e);
      return Response.json({
        error: "500 Internal Server Error",
      });
    }
  },
});
