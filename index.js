/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import App2 from './App2';
import {name as appName} from './app.json';

console.log('[index.js] Registering components...');
console.log('[index.js] Main app name:', appName);

// 注册主应用
AppRegistry.registerComponent(appName, () => {
  console.log('[index.js] Rendering main app');
  return App;
});

// 注册详情页面
AppRegistry.registerComponent('RecommendationDetail', () => {
  console.log('[index.js] Rendering RecommendationDetail');
  return App2;
});

// 列出所有已注册的组件
console.log('[index.js] Registered components:', AppRegistry.getRunnable());
