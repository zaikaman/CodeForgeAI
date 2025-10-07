module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: [
      './backend/tsconfig.json',
      './frontend/tsconfig.json',
      './frontend/tsconfig.node.json',
      './shared/tsconfig.json'
    ],
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint'],

  ignorePatterns: ['dist', 'node_modules', '.eslintrc.js']
}
