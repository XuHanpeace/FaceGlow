/**
 * 认证服务使用示例
 * 
 * 本文件展示如何在不同场景下使用认证服务
 */

import { authService } from './authService';

// ============================================
// 场景1: 公开内容（允许匿名用户访问）
// 例如：浏览activity、查看公开模板等
// ============================================
export async function getPublicContent() {
  // 使用 ensureAuthenticated() - 会自动匿名登录
  const authResult = await authService.ensureAuthenticated();
  
  if (!authResult.success) {
    console.error('认证失败:', authResult.error);
    return {
      success: false,
      message: '获取内容失败',
    };
  }
  
  // 继续执行业务逻辑...
  console.log('可以访问公开内容');
  return {
    success: true,
    data: '公开内容',
  };
}

// ============================================
// 场景2: 需要真实用户的功能
// 例如：购买、创作、个人信息等
// ============================================
export async function purchaseItem() {
  // 使用 requireRealUser() - 不允许匿名用户
  const authResult = await authService.requireRealUser();
  
  if (!authResult.success) {
    // 根据错误码处理
    if (authResult.error?.code === 'ANONYMOUS_USER') {
      // 匿名用户，需要弹出登录页面
      console.log('👉 需要跳转到登录页面');
      // navigateToLogin();
      return {
        success: false,
        needLogin: true,
        message: '此功能需要登录',
      };
    } else if (authResult.error?.code === 'NOT_LOGGED_IN') {
      // 未登录，需要弹出登录页面
      console.log('👉 需要跳转到登录页面');
      // navigateToLogin();
      return {
        success: false,
        needLogin: true,
        message: '请先登录',
      };
    } else {
      // 其他错误
      return {
        success: false,
        message: authResult.error?.message || '认证失败',
      };
    }
  }
  
  // 真实用户，继续执行业务逻辑
  console.log('✅ 真实用户，可以购买');
  return {
    success: true,
    message: '购买成功',
  };
}

// ============================================
// 场景3: 检查用户状态
// ============================================
export function checkUserStatus() {
  // 检查是否已登录
  const isLoggedIn = authService.isLoggedIn();
  
  // 检查是否是匿名用户
  const isAnonymous = authService.isAnonymous();
  
  // 检查是否是真实用户
  const isRealUser = authService.isRealUser();
  
  console.log({
    isLoggedIn,    // true/false
    isAnonymous,   // true/false
    isRealUser,    // true/false
  });
  
  return {
    isLoggedIn,
    isAnonymous,
    isRealUser,
  };
}

// ============================================
// 使用示例：在服务中应用
// ============================================

/**
 * 示例：用户创作服务
 * 需要真实用户才能创作
 */
export class UserCreationService {
  async createWork(data: Record<string, unknown>) {
    // 要求真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      return {
        success: false,
        needLogin: authResult.error?.code === 'ANONYMOUS_USER' || authResult.error?.code === 'NOT_LOGGED_IN',
        error: authResult.error,
      };
    }
    
    // 继续创作逻辑...
    console.log('创作作品:', data);
    return {
      success: true,
      data: { workId: '123' },
    };
  }
}

/**
 * 示例：用户购买服务
 * 需要真实用户才能购买
 */
export class PurchaseService {
  async buyCoins(amount: number) {
    // 要求真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      return {
        success: false,
        needLogin: authResult.error?.code === 'ANONYMOUS_USER' || authResult.error?.code === 'NOT_LOGGED_IN',
        error: authResult.error,
      };
    }
    
    // 继续购买逻辑...
    console.log('购买金币:', amount);
    return {
      success: true,
      data: { coins: amount },
    };
  }
}

/**
 * 示例：个人资料服务
 * 需要真实用户才能访问
 */
export class ProfileService {
  async getProfile() {
    // 要求真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      return {
        success: false,
        needLogin: authResult.error?.code === 'ANONYMOUS_USER' || authResult.error?.code === 'NOT_LOGGED_IN',
        error: authResult.error,
      };
    }
    
    // 获取个人资料...
    console.log('获取个人资料');
    return {
      success: true,
      data: { username: 'user123' },
    };
  }
}

