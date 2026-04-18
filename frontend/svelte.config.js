import adapter from "@sveltejs/adapter-static";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vitePreprocess } from '@sveltejs/kit/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({
    style: {
      css: {
        preprocessorOptions: {
          scss: {
            api: "modern",
            importer: [
              (url) => {
                if (url.startsWith("$lib")) {
                  return {
                    file: url.replace(/^\$lib/, path.join(dirname, "src", "lib")),
                  };
                }
                return url;
              },
            ],
          },
        },
      },
    },
  }),

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: false
    }),
  },
};

export default config;
