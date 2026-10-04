import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const { startProdServer } = await import("../node_modules/vinext/dist/server/prod-server.js");
  const { server, port } = await startProdServer({ host: "127.0.0.1", port: 0, outDir: resolve("dist") });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const homeHtml = await response.text();
    assert.match(homeHtml, developmentPreviewMeta);
    assert.match(homeHtml, /تجربه‌ای مطمئن برای انتخاب خانه/);
    assert.doesNotMatch(homeHtml, /class="mobile-route"/);

    const appResponse = await fetch(`http://127.0.0.1:${port}/app`, { headers: { accept: "text/html" } });
    assert.equal(appResponse.status, 200);
    assert.match(await appResponse.text(), /class="mobile-route"/);
  } finally {
    await new Promise(resolveClose => server.close(resolveClose));
  }
});
