/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';


// 注册主应用
AppRegistry.registerComponent(appName, () => {
  console.log('[index.js] Rendering main app');
  return App;
});
