/** @type {import("snowpack").SnowpackUserConfig } */

module.exports = {
  mount: {
    public: '/',
    src: '/_dist_',
  },
  plugins: [
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
    [
      '@snowpack/plugin-build-script',
      { cmd: 'postcss', input: ['.css'], output: ['.css'] },
    ],
  ],
  experiments: {},

  install: [
    /* ... */
  ],
  installOptions: {
    /* ... */
  },
  devOptions: {
    output: 'stream',
  },
  buildOptions: {
    /* ... */
  },
  proxy: {
    '/api': 'http://localhost:5000',
  },
  alias: {
    '~': './src',
  },
};
