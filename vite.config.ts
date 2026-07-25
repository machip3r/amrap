import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			srcDir: 'src',
			registerType: 'prompt',
			strategies: 'generateSW',
			manifest: {
				name: 'AMRAP',
				short_name: 'AMRAP',
				description: 'Gym membership admin — check-in, classes, members, timers.',
				lang: 'es',
				dir: 'ltr',
				start_url: '/app',
				scope: '/',
				id: '/',
				display: 'standalone',
				orientation: 'portrait-primary',
				background_color: '#0b1120',
				theme_color: '#ff6b6b',
				categories: ['fitness', 'business', 'productivity'],
				icons: [
					{
						src: '/pwa/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa/icon-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// Shell assets only — do not precache authenticated HTML/data.
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2,webmanifest}'],
				// Landing hero is ~2.3MB — load on demand via runtimeCaching, not SW install.
				globIgnores: ['**/images/hero-gym.png'],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: false,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-stylesheets',
							expiration: {
								maxEntries: 8,
								maxAgeSeconds: 60 * 60 * 24 * 365
							}
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-webfonts',
							expiration: {
								maxEntries: 16,
								maxAgeSeconds: 60 * 60 * 24 * 365
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
						handler: 'NetworkOnly'
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'amrap-images',
							expiration: {
								maxEntries: 64,
								maxAgeSeconds: 60 * 60 * 24 * 30
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true,
				suppressWarnings: true,
				type: 'module',
				navigateFallback: '/app'
			},
			kit: {
				includeVersionFile: true
			}
		})
	],
	server: {
		// ngrok free URLs rotate; leading `.` allows all subdomains
		allowedHosts: ['.ngrok-free.app', '.ngrok.app']
	}
});
