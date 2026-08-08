import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

const nextPluginRules = { rules: nextPlugin.default.rules };

const sharedGlobals = {
  React: "readonly",
  window: "readonly",
  document: "readonly",
  setTimeout: "readonly",
  setInterval: "readonly",
  clearTimeout: "readonly",
  clearInterval: "readonly",
  fetch: "readonly",
  process: "readonly",
  Image: "readonly",
  HTMLCanvasElement: "readonly",
  HTMLImageElement: "readonly",
  HTMLDivElement: "readonly",
  HTMLElement: "readonly",
  HTMLInputElement: "readonly",
  CanvasRenderingContext2D: "readonly",
  CanvasTextAlign: "readonly",
  MouseEvent: "readonly",
  TouchEvent: "readonly",
  Touch: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  performance: "readonly",
  ResizeObserver: "readonly",
  PointerEvent: "readonly",
};

export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    ...js.configs.recommended,
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ...(js.configs.recommended.languageOptions || {}),
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...((js.configs.recommended.languageOptions || {}).globals || {}),
        ...sharedGlobals,
      },
    },
  },
  {
    plugins: {
      "@next/next": nextPluginRules,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: sharedGlobals,
    },
  },
];
