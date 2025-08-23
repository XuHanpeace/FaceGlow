// 测试 HTTP API 实现的文件
// 可以在开发时使用这个文件来测试各个 API 方法

import { cloudbaseHttpApi } from './cloudbaseHttpApi';

/**
 * 测试匿名登录
 */
export const testAnonymousLogin = async () => {
  console.log('开始测试匿名登录...');
  try {
    const result = await cloudbaseHttpApi.anonymousLogin();
    console.log('匿名登录测试结果:', result);
    return result;
  } catch (error) {
    console.error('匿名登录测试失败:', error);
    return false;
  }
};

/**
 * 测试云函数调用
 */
export const testCallFunction = async () => {
  console.log('开始测试云函数调用...');
  try {
    const result = await cloudbaseHttpApi.callFunction('fusion', {
      prompt: '测试提示',
      style: 'test',
    });
    console.log('云函数调用测试结果:', result);
    return result;
  } catch (error) {
    console.error('云函数调用测试失败:', error);
    return null;
  }
};

/**
 * 测试登录状态检查
 */
export const testCheckLoginStatus = async () => {
  console.log('开始测试登录状态检查...');
  try {
    const result = await cloudbaseHttpApi.checkLoginStatus();
    console.log('登录状态检查测试结果:', result);
    return result;
  } catch (error) {
    console.error('登录状态检查测试失败:', error);
    return false;
  }
};

/**
 * 运行所有测试
 */
export const runAllTests = async () => {
  console.log('=== 开始运行 HTTP API 测试 ===');
  
  // 测试匿名登录
  await testAnonymousLogin();
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试登录状态
  await testCheckLoginStatus();
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试云函数调用
  await testCallFunction();
  
  console.log('=== HTTP API 测试完成 ===');
};

// 导出测试函数
export default {
  testAnonymousLogin,
  testCallFunction,
  testCheckLoginStatus,
  runAllTests,
};
