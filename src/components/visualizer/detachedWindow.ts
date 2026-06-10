export const writeDetachedVisualizerDocument = (detachedWindow: Window) => {
  detachedWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>MixFade Visualizer</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #000; color: #fff; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      body { position: relative; }
      #mixfade-detached-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: #000; }
      #mixfade-detached-overlay { pointer-events: none; position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 48%), linear-gradient(to bottom, rgba(3,7,18,0.22), rgba(2,6,23,0.62)); }
      .mixfade-detached-card { position: absolute; bottom: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.28); backdrop-filter: blur(16px); border-radius: 16px; padding: 12px 16px; }
      #mixfade-detached-left { left: 24px; display: none; }
      #mixfade-detached-right { right: 24px; display: none; }
      .mixfade-detached-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.28em; color: rgb(148 163 184); }
      .mixfade-detached-value { margin-top: 4px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; color: white; }
    </style>
  </head>
  <body>
    <video id="mixfade-detached-video" autoplay muted playsinline></video>
    <div id="mixfade-detached-overlay"></div>
    <div id="mixfade-detached-left" class="mixfade-detached-card">
      <div id="mixfade-detached-deck-label" class="mixfade-detached-label"></div>
      <div id="mixfade-detached-track-label" class="mixfade-detached-value"></div>
    </div>
    <div id="mixfade-detached-right" class="mixfade-detached-card">
      <div class="mixfade-detached-label">Seed</div>
      <div id="mixfade-detached-seed-label" class="mixfade-detached-value"></div>
    </div>
  </body>
</html>`);
  detachedWindow.document.close();
};
