let dbPromise;
function database() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("techmanager-local-v1", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("sessions");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  return dbPromise;
}
export async function getLocal(key) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const req = db.transaction("sessions").objectStore("sessions").get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
export async function putLocal(key, value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
export const localKey = (auth, ticket) =>
  `${auth.code}:${auth.playerId}:${ticket}`;
export async function loadTicket(auth, id) {
  let value = await getLocal(localKey(auth, id));
  if (!value && auth.previousRoom && auth.previousId) {
    value = await getLocal(`${auth.previousRoom}:${auth.previousId}:${id}`);
    if (value) await putLocal(localKey(auth, id), value);
  }
  return (
    value || {
      pc: null,
      conversation: [],
      node: "start",
      confirmed: false,
      summary: "",
    }
  );
}
export function downloadJson(data, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
