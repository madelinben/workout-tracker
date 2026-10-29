import { createRoot } from "react-dom/client";
import { WorkoutApp } from "../src";
import "./demo.css";

createRoot(document.getElementById("root") as HTMLElement).render(<WorkoutApp />);
