import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const apiUrl = env.VITE_API_URL || 'http://localhost/TechMart/Backend/api';

  return {
    envDir: '../', // Nạp file .env từ thư mục gốc E-COMMERCE
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'vite-plugin-seo-crawler-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            const userAgent = req.headers['user-agent'] || '';
            const isBotParam = url.includes('bot=1');
            const isCrawler = /(facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Pinterest|Slackbot|TelegramBot|WhatsApp|ZaloPlatform|Zalo|Googlebot|bingbot)/i.test(userAgent);

            // Bắt request đến link sản phẩm khi gặp bot hoặc param ?bot=1
            const match = url.match(/^\/product\/([^/?#]+)/);
            if (match && (isCrawler || isBotParam)) {
              const slugOrId = match[1];
              try {
                const backendOrigin = apiUrl.replace(/\/api\/?$/, '');
                const targetUrl = `${backendOrigin}/api/common/seo_render.php?slug=${encodeURIComponent(slugOrId)}&bot=1`;
                const fetchRes = await fetch(targetUrl);
                if (fetchRes.ok) {
                  const html = await fetchRes.text();
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  res.statusCode = 200;
                  res.end(html);
                  return;
                }
              } catch {
                // Nếu PHP server chưa chạy hoặc lỗi kết nối, tiếp tục flow mặc định của Vite
              }
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
      strictPort: true, // Không tự động nhảy sang 3001 nếu cổng 3000 đang được dùng
      headers: {
        'Cache-Control': 'no-store', // Ngăn Google Chrome cache module cũ trong lúc dev
      },
    },
  };
});
