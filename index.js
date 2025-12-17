/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// React Native 环境 polyfill：为 Aegis SDK 提供 location 对象
// Aegis SDK 在错误上报时可能会访问 location 对象，但 React Native 中没有这个对象
// 这会导致 "Property 'location' doesn't exist" 错误，进而导致错误上报失败（404）
if (typeof global !== 'undefined' && !global.location) {
  global.location = {
    href: 'react-native://app',
    protocol: 'react-native:',
    host: 'app',
    hostname: 'app',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'react-native://app',
    toString: () => 'react-native://app',
  };
}

// 注册主应用
AppRegistry.registerComponent(appName, () => App);
