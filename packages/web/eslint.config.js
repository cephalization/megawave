import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// @ts-ignore
import reactCompiler from 'eslint-plugin-react-compiler';
// @ts-ignore
import hooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  tseslint.configs.base,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  {
    plugins: {
      // @ts-ignore bad types from eslint-plugin-react-hooks
      'react-hooks': hooksPlugin,
    },
    // @ts-ignore bad types from eslint-plugin-react-hooks
    rules: hooksPlugin.configs.recommended.rules,
  },
  eslintPluginPrettierRecommended,
);
