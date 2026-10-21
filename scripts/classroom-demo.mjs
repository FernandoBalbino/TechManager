// Local QA only. Never point simulated students at a hosted backend.
import { io } from "socket.io-client";
const code = process.argv[2];
if (!code) throw Error("A local room code is required");
const sockets = [];
for (let i = 0; i < 14; i++) {
  const socket = io("http://localhost:3001", { transports: ["websocket"] });
  sockets.push(socket);
  await new Promise((resolve) => socket.on("connect", resolve));
  await new Promise((resolve) =>
    socket.emit(
      "room:join",
      {
        name:
          [
            "Ana",
            "Pedro",
            "João",
            "Luiza",
            "Miguel",
            "Laura",
            "Arthur",
            "Helena",
            "Davi",
            "Alice",
            "Samuel",
            "Cecília",
            "Enzo",
            "Isabela",
          ][i] + " Teste",
        code,
      },
      (result) => {
        if (!result.ok) throw Error(result.error);
        resolve();
      },
    ),
  );
}
console.log("14 local classmates ready; join the 15th through the browser.");
process.on("SIGINT", () => {
  sockets.forEach((s) => s.disconnect());
  process.exit();
});
