const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 * 
 * 注意：视频文件（.mp4）使用原生资源路径 { uri: 'v2.mp4' } 访问，
 * 不会被包含在 JS bundle 中，从而减少热更新 bundle 大小。
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
