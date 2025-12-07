/**
 * 应用主题配置
 */

// 主题色渐变配置
export const themeColors = {
  // 主渐变色（粉色到橙色）
  primary: {
    gradient: ['#FF6B9D', '#FF6B35'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  // 次要渐变色（蓝色系）
  secondary: {
    gradient: ['#4A90E2', '#67B8E3'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  // 成功渐变色（绿色系）
  success: {
    gradient: ['#4CAF50', '#66BB6A'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  // 警告渐变色（黄色系）
  warning: {
    gradient: ['#FF9800', '#FFA726'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  // 错误渐变色（红色系）
  error: {
    gradient: ['#E91E63', '#F06292'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  // App 图标渐变色（粉红到紫色，对角线）
  appIcon: {
    gradient: ['#FF6C9F', '#AE55F3'], // rgb(255 108 159) -> rgb(174 85 243)
    start: { x: 0, y: 0 }, // 左上角
    end: { x: 1, y: 1 }, // 右下角
  },
};

// 纯色主题色（用于边框、文本等）
export const colors = {
  primary: '#FF6B9D',
  primaryDark: '#FF6B35',
  secondary: '#4A90E2',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E91E63',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#999999',
  lightGray: '#CCCCCC',
  darkGray: '#666666',
};

// 渐变方向配置
export const gradientDirections = {
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  diagonalReverse: { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
};

