// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // 关键点：这里加了 @tailwindcss/ 前缀
    autoprefixer: {},
  },
}