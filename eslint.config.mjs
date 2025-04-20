import antfu from '@antfu/eslint-config'
import perfectionist from 'eslint-plugin-perfectionist'

export default antfu({
  // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
  ignores: [
    '**/fixtures',
    // ...globs
  ],

  // Disable jsonc and yaml support
  jsonc: false,

  //   lessOpinionated: true,
  rules: {
    'import/order': 'off',
    ...perfectionist.configs['recommended-natural'].rules,
  },
  // Enable stylistic formatting rules
  // stylistic: true,
  stylistic: {
    indent: 2, // 4, or 'tab'
    quotes: 'single', // or 'double'
  },

  // Type of the project. 'lib' for libraries, the default is 'app'
  type: 'lib',
  // TypeScript and Vue are autodetected, you can also explicitly enable them:
  typescript: true,

  vue: true,
  yaml: false,
})
