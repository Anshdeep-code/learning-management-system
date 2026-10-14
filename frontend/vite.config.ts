import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Port 3000 matches CLIENT_URL=http://localhost:3000 in the backend's env.example (CORS + Stripe redirects).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
});
