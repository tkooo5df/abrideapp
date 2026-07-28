import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const bootstrap = async () => {
  try {
  } catch (error) {
  }

  createRoot(document.getElementById("root")!).render(<App />);
};

bootstrap();