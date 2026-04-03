import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    plugins: [
      react(),
      // Tailwind is only used by the demo app (dev mode), not the library build
      ...(!isBuild ? [tailwindcss()] : []),
      ...(isBuild
        ? [
            dts({
              include: ['src/**/*'],
              exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
              rollupTypes: true,
            }),
          ]
        : []),
    ],
    ...(isBuild
      ? {
          build: {
            lib: {
              entry: {
                index: resolve(__dirname, 'src/index.ts'),
                utils: resolve(__dirname, 'src/utils-entry.ts'),
              },
              formats: ['es'] as const,
            },
            rollupOptions: {
              external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'hls.js',
                'pdfjs-dist',
                'pdfjs-dist/build/pdf.worker.min.mjs',
                'waveform-data',
                'lucide-react',
              ],
              output: {
                assetFileNames: (assetInfo) => {
                  if (assetInfo.name?.endsWith('.css')) {
                    return 'index.css';
                  }
                  return assetInfo.name ?? 'asset';
                },
              },
            },
            cssCodeSplit: false,
            sourcemap: false,
            minify: true,
          },
        }
      : {}),
  };
});
