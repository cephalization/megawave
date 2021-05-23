/** @type {import("snowpack").SnowpackUserConfig } */
import proxy from 'http2-proxy';
import throttle from 'lodash.throttle';

const proxyConfig = {
  hostname: 'localhost',
  port: 5000,
};

const dProxyWeb = throttle(proxy.web, 3000);

function handleError(err, req, res) {
  if (err) console.warn('Server not ready... retrying in 3 seconds...');

  if (res.headersSent) return;

  return dProxyWeb(req, res, proxyConfig, handleError);
}

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

        return proxy.web(req, res, proxyConfig, handleError);
      },
    },
  ],
  alias: {
    '~': './src',
  },
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2018',
  },
};
