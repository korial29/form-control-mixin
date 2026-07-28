import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import openWC from '@open-wc/eslint-config';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'demo/**'],
  },
  ...openWC,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      curly: ['error', 'all'],
      'class-methods-use-this': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'import-x/extensions': 'off',
      'import-x/no-unresolved': 'off',
      'no-unused-expressions': ['error', { allowTernary: true }],
      'require-await': 'error',
      'sort-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
      'no-lone-blocks': 'off',
      'no-use-before-define': 'warn',
      'no-shadow': 'off',
      camelcase: 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-member-accessibility': 'warn',
      '@typescript-eslint/member-ordering': 'warn',
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'memberLike',
          modifiers: ['private', 'protected'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
);
