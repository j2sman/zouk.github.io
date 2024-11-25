// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    quotes: ["error", "double"], // 큰따옴표 허용
    "@stylistic/semi": "off", // 세미콜론 규칙 비활성화
    "@stylistic/comma-dangle": "off", // 쉼표 규칙 비활성화
  },
});
