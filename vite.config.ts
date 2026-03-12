import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 7426,
    },
    optimizeDeps: {
        include: ['pouchdb-browser', 'pouchdb-find', 'events']
    },
    plugins: [
        tailwindcss(),
        sveltekit(),
        SvelteKitPWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            includeAssets: ['favicon.svg', 'icons/*.png'],
            kit: {
                adapterFallback: 'index.html'
            },
            manifest: {
                id: '/',
                name: 'Stack – List Manager',
                short_name: 'Stack',
                description: 'A multi-purpose list manager PWA',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
                additionalManifestEntries: [
                    { url: 'index.html', revision: Date.now().toString() }
                ]
            }
        })
    ]
});
