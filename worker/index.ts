/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  AUTOMATION_SECRET?: string;
  HATAM_PRESENTATION_MODE?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (env.HATAM_PRESENTATION_MODE === "owner-private-readonly" &&
        (!["GET", "HEAD", "OPTIONS"].includes(request.method) || url.pathname === "/api/payments/callback")) {
      return Response.json({ok:false,error:"PRESENTATION_READ_ONLY",message:"این نسخه مخصوص نمایش است؛ ثبت و تغییر اطلاعات غیرفعال است."},{status:403});
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if(env.HATAM_PRESENTATION_MODE === "owner-private-readonly")return;
    const headers = new Headers({ "content-type": "application/json" });
    if (env.AUTOMATION_SECRET) headers.set("authorization", `Bearer ${env.AUTOMATION_SECRET}`);
    ctx.waitUntil(handler.fetch(new Request("https://hatam.internal/api/system/process-communications", { method: "POST", headers }), env, ctx).then(async response => {
      if (!response.ok) throw new Error(`COMMUNICATION_CRON_FAILED_${response.status}`);
      await response.arrayBuffer();
    }));
  },
};

export default worker;
