import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // 載入環境變量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['512x512.png'],
        manifest: {
          name: '小學一年級生字筆順王',
          short_name: '筆順王',
          start_url: '.',
          display: 'standalone',
          background_color: '#FFF9C4',
          theme_color: '#FFF9C4', // 修正：應為底線 theme_color
          description: '專為小一學生設計的中文筆順練習遊戲',
          icons: [
            {
              src: '512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ], // 這裡原本少了逗號
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // 建議指向 src 資料夾
      },
    },
  };
});