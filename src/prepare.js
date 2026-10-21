export async function prepareEnvironment(progress) {
  const base = import.meta.env.BASE_URL;
  const manifest = await fetch(base + "offline-manifest.json").then((r) => {
    if (!r.ok) throw new Error("Não foi possível preparar o ambiente.");
    return r.json();
  });
  const cache = await caches.open("techmanager-assets-" + manifest.version);
  let index = 0,
    finished = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (index < manifest.files.length) {
        const path = base + manifest.files[index++];
        if (!(await cache.match(path))) {
          const response = await fetch(path);
          if (!response.ok) throw new Error("Falha ao preparar " + path);
          await cache.put(path, response);
        }
        progress(++finished / manifest.files.length);
      }
    }),
  );
  if ("serviceWorker" in navigator && import.meta.env.PROD)
    await navigator.serviceWorker.register(base + "service-worker.js", {
      scope: base,
    });
  return manifest.bytes;
}
