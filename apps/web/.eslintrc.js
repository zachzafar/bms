/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "react/no-unescaped-entities": "off",
    "react/jsx-key": "off",
    "react-hooks/exhaustive-deps": "off",
    "@next/next/no-img-element": "off",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
