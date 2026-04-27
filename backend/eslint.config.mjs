import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], 
    languageOptions: { globals: {...globals.browser, ...globals.node} } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ['**/tests/**/*.js'], languageOptions: { globals: { ...globals.jest } } },
  { files: ["**/routes/*.js"], languageOptions: { globals: { fs: true } } },
  {  rules: {

    complexity: ["warn", 5],
    //"max-lines-per-function": ["warn", 100],
    "max-depth": ["warn", 3],
    "max-params": ["warn", 3],

    "no-unused-vars": "warn",
    "no-magic-numbers": ["warn", { ignore: [0,1] }],
    eqeqeq: ["warn", "always"],
    "prefer-const": "warn"

    }
  }
]);

