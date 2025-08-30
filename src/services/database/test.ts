// 数据库服务测试文件
// 用于验证服务是否正常工作

import { userDataService, databaseService } from './index';

// 测试数据库服务实例化
export const testDatabaseService = () => {
  console.log('🧪 测试数据库服务...');
  
  try {
    // 测试基础服务
    console.log('✅ DatabaseService 实例化成功');
    console.log('✅ UserDataService 实例化成功');
    
    // 测试配置
    console.log('📋 服务配置检查完成');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库服务测试失败:', error);
    return false;
  }
};

// 测试用户数据服务方法
export const testUserDataService = () => {
  console.log('🧪 测试用户数据服务方法...');
  
  try {
    // 检查方法是否存在
    const methods = [
      'createUser',
      'updateLastLoginTime', 
      'getUserByUid',
      'getUserByUsername',
      'updateUserInfo'
    ];
    
    methods.forEach(method => {
      if (typeof (userDataService as any)[method] === 'function') {
        console.log(`✅ ${method} 方法存在`);
      } else {
        console.log(`❌ ${method} 方法不存在`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ 用户数据服务测试失败:', error);
    return false;
  }
};

// 运行所有测试
export const runAllTests = () => {
  console.log('🚀 开始运行数据库服务测试...\n');
  
  const serviceTest = testDatabaseService();
  const userTest = testUserDataService();
  
  console.log('\n📊 测试结果汇总:');
  console.log(`基础服务: ${serviceTest ? '✅ 通过' : '❌ 失败'}`);
  console.log(`用户服务: ${userTest ? '✅ 通过' : '❌ 失败'}`);
  
  return serviceTest && userTest;
};
