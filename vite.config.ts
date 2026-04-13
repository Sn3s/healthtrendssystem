import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseTarget = (env.VITE_SUPABASE_URL || "https://girexwuowlezmwyblofx.supabase.co").replace(/\/$/, "");

  /** Same-origin proxy → Supabase Edge Functions (avoids browser CORS on /functions/v1). */
  const edgeProxy = {
    "/supabase-edge": {
      target: supabaseTarget,
      changeOrigin: true,
      secure: true,
      rewrite: (p: string) => p.replace(/^\/supabase-edge/, ""),
    },
  };

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: edgeProxy,
    },
    preview: {
      proxy: edgeProxy,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
