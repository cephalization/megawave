/** @type {import("snowpack").SnowpackUserConfig } */
import proxy from 'http2-proxy';

export default {
  mount: {
    public: '/',
    src: '/_dist_',
  },
  plugins: [
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
    '@snowpack/plugin-postcss',
  ],
  devOptions: {
    output: 'stream',
    tailwindConfig: './tailwind.config.js',
  },
  routes: [
    {
      src: '/api/.*',
      dest: (req, res) => {
        // remove /api prefix (optional)
        req.url = req.url.replace(/^\/api/, '');

        return proxy.web(req, res, {
          hostname: 'localhost',
          port: 5000,
        });
      },
    },
  ],
  alias: {
    '~': './src',
  },
};
