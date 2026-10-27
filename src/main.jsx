import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

// Keep the lesson independent: opening /slide never imports the room connection.
const load = /\/slide\/?$/.test(location.pathname)
  ? import("./slides/Slides.jsx").then(({ Slides }) => Slides)
  : import("./App.jsx").then(({ App }) => App);

load.then((App) => {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
