module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "plugin:prettier/recommended",
    "plugin:node/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
    "node/no-missing-import": "off",
    "node/no-extraneous-import": "off",
    "no-unused-expressions": "off",
    "node/no-unsupported-features/es-syntax": "off"
  },
};
