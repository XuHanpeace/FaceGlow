module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'off', // 禁用内联样式检查
    'no-catch-shadow': 'off',  // 添加这一行
    // 未使用的变量和导入检查
    'no-unused-vars': 'off', // 关闭基础规则，使用 TypeScript 版本
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all', // 检查所有变量
        args: 'after-used', // 只检查使用后的参数
        ignoreRestSiblings: true, // 忽略解构中的 rest siblings
        argsIgnorePattern: '^_', // 以下划线开头的参数不检查（用于占位符）
        varsIgnorePattern: '^_', // 以下划线开头的变量不检查（用于占位符）
      },
    ],
  },
};
