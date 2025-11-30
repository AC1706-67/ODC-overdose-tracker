import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1) Global ignores (lint won't even look at these)
  {
    ignores: [
      "test-*.js",
      "test-*.ts",
      "*-test.js",
      "*-test.ts",
      "scripts/**",
      "*.sql",
      "*.md",
      "node_modules/**",
      "dist/**",
      "build/**",
      ".expo/**",
      "android/**",
      "ios/**",
    ],
  },

  // 2) Base JS + TS configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3) Project-specific tweaks
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
    rules: {
      // Relax this for now so we don't fight over 3 `any` types
      "@typescript-eslint/no-explicit-any": "off",
      // Don't complain about require() in plain JS helper scripts
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
