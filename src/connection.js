import { io } from "socket.io-client";
export const serverUrl = import.meta.env.VITE_REALTIME_URL || "";
// In development Vite proxies the socket to Node. Published Pages uses the explicit Render URL.
export const socket = io(serverUrl || location.origin, {
  autoConnect: false,
  transports: ["websocket"],
  reconnectionDelayMax: 5000,
});
export function request(event, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!socket.connected)
      return reject(
        new Error(
          "A conexão está sendo restabelecida. Seu PC continua salvo neste navegador.",
        ),
      );
    socket.timeout(12000).emit(event, payload, (error, response) => {
      if (error)
        reject(
          new Error("O servidor demorou para responder. Aguarde a reconexão."),
        );
      else if (!response?.ok) {
        const e = new Error(response?.error || "Não foi possível concluir.");
        e.code = response?.code;
        reject(e);
      } else resolve(response.data);
    });
  });
}
