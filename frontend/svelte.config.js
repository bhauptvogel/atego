import adapter from "@sveltejs/adapter-node";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vitePreprocess } from '@sveltejs/kit/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess({
    style: {
      css: {
        preprocessorOptions: {
          scss: {
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
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),
  },
};

export default config;
