// import path from "path"
// import tailwindcss from "@tailwindcss/vite"
// import react from "@vitejs/plugin-react"
// import { defineConfig } from "vite"

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//     server: {
//       port: 3000, 
//       proxy: {
//         '/api': {
//           target: 'https://chat-2swc.onrender.com',
//           changeOrigin: true,
//           secure: false,
//         },
//       },
//     }
// })


import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Chat API
      "/chat-api": {
        target: "https://chat-2swc.onrender.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/chat-api/, "/api"),
      },

      // Liveflow API
      "/api": {
        target: "https://liveflow-v99z.onrender.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/liveflow-api/, "/api"),
      },
    },
  },
})
