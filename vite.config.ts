import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      plugins: [
        react(),
        VitePWA ({
          registerType: 'autoUpdate',
          includeAssets: ['512x512.png'],
          manifest: {
            name: '小學一年級生字筆順王',
            short_name: '筆順王',
            start_url: '.',
            display: 'standalone',
            background_color: '#FFF9C4',
            theme-color:'#FFF9C4',
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
        })
      ]
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
