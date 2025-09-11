#!/usr/bin/env node

/**
 * iOS 订阅功能快速测试脚本
 * 用于验证订阅相关的配置和功能
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍎 iOS 订阅功能测试脚本');
console.log('========================\n');

// 检查项目结构
function checkProjectStructure() {
  console.log('📁 检查项目结构...');
  
  const requiredFiles = [
    'ios/ApplePayModule.h',
    'ios/ApplePayModule.m',
    'src/screens/SubscriptionScreen.tsx',
    'src/screens/SubscriptionTestScreen.tsx',
    'src/utils/subscriptionTest.ts',
    'src/navigation/StackNavigator.tsx',
    'src/types/navigation.ts'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('❌ 缺少以下文件:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  console.log('✅ 项目结构检查通过');
  return true;
}

// 检查iOS配置
function checkIOSConfiguration() {
  console.log('\n📱 检查iOS配置...');
  
  try {
    // 检查Info.plist
    const infoPlistPath = 'ios/MyCrossPlatformApp/Info.plist';
    if (!fs.existsSync(infoPlistPath)) {
      console.log('❌ Info.plist 文件不存在');
      return false;
    }
    
    // 检查ApplePayModule
    const applePayModulePath = 'ios/ApplePayModule.m';
    const applePayContent = fs.readFileSync(applePayModulePath, 'utf8');
    
    if (!applePayContent.includes('SKProductsRequestDelegate')) {
      console.log('❌ ApplePayModule 缺少必要的协议');
      return false;
    }
    
    if (!applePayContent.includes('getAvailableProducts')) {
      console.log('❌ ApplePayModule 缺少产品获取方法');
      return false;
    }
    
    if (!applePayContent.includes('purchaseProduct')) {
      console.log('❌ ApplePayModule 缺少购买方法');
      return false;
    }
    
    console.log('✅ iOS配置检查通过');
    return true;
    
  } catch (error) {
    console.log('❌ iOS配置检查失败:', error.message);
    return false;
  }
}

// 检查React Native配置
function checkRNConfiguration() {
  console.log('\n⚛️ 检查React Native配置...');
  
  try {
    // 检查导航配置
    const stackNavigatorPath = 'src/navigation/StackNavigator.tsx';
    const stackNavigatorContent = fs.readFileSync(stackNavigatorPath, 'utf8');
    
    if (!stackNavigatorContent.includes('SubscriptionTestScreen')) {
      console.log('❌ StackNavigator 缺少 SubscriptionTestScreen');
      return false;
    }
    
    // 检查类型定义
    const navigationTypesPath = 'src/types/navigation.ts';
    const navigationTypesContent = fs.readFileSync(navigationTypesPath, 'utf8');
    
    if (!navigationTypesContent.includes('SubscriptionTest')) {
      console.log('❌ 导航类型定义缺少 SubscriptionTest');
      return false;
    }
    
    // 检查测试中心配置
    const testCenterPath = 'src/screens/TestCenterScreen.tsx';
    const testCenterContent = fs.readFileSync(testCenterPath, 'utf8');
    
    if (!testCenterContent.includes('subscriptionTest')) {
      console.log('❌ TestCenterScreen 缺少订阅测试入口');
      return false;
    }
    
    console.log('✅ React Native配置检查通过');
    return true;
    
  } catch (error) {
    console.log('❌ React Native配置检查失败:', error.message);
    return false;
  }
}

// 检查产品ID配置
function checkProductIDs() {
  console.log('\n🛒 检查产品ID配置...');
  
  try {
    const subscriptionScreenPath = 'src/screens/SubscriptionScreen.tsx';
    const subscriptionScreenContent = fs.readFileSync(subscriptionScreenPath, 'utf8');
    
    const productIds = [
      'com.faceglow.weekly',
      'com.faceglow.monthly',
      'com.faceglow.yearly'
    ];
    
    const missingProductIds = [];
    
    productIds.forEach(productId => {
      if (!subscriptionScreenContent.includes(productId)) {
        missingProductIds.push(productId);
      }
    });
    
    if (missingProductIds.length > 0) {
      console.log('❌ 缺少以下产品ID:');
      missingProductIds.forEach(id => console.log(`   - ${id}`));
      return false;
    }
    
    console.log('✅ 产品ID配置检查通过');
    console.log('   配置的产品ID:');
    productIds.forEach(id => console.log(`   - ${id}`));
    
    return true;
    
  } catch (error) {
    console.log('❌ 产品ID配置检查失败:', error.message);
    return false;
  }
}

// 检查沙盒环境配置
function checkSandboxConfiguration() {
  console.log('\n🏖️ 检查沙盒环境配置...');
  
  console.log('📋 沙盒环境检查清单:');
  console.log('   □ 在 App Store Connect 中创建沙盒测试账户');
  console.log('   □ 在设备上登录沙盒测试账户');
  console.log('   □ 产品ID在 App Store Connect 中已创建');
  console.log('   □ 产品状态为 "Ready for Sale"');
  console.log('   □ Bundle ID 匹配: com.faceglow.app');
  
  console.log('\n💡 提示: 请确保以上配置都已完成');
  
  return true;
}

// 生成测试报告
function generateTestReport(results) {
  console.log('\n📊 测试报告');
  console.log('============');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests} ✅`);
  console.log(`失败: ${failedTests} ❌`);
  
  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！可以开始沙盒测试了。');
    console.log('\n🚀 下一步:');
    console.log('   1. 启动iOS应用: npx react-native run-ios');
    console.log('   2. 导航到测试中心 → 订阅功能测试');
    console.log('   3. 按照测试指南执行各项测试');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查配置后重试。');
  }
}

// 主函数
function main() {
  const results = {
    projectStructure: checkProjectStructure(),
    iosConfiguration: checkIOSConfiguration(),
    rnConfiguration: checkRNConfiguration(),
    productIDs: checkProductIDs(),
    sandboxConfiguration: checkSandboxConfiguration()
  };
  
  generateTestReport(results);
}

// 运行测试
main();
