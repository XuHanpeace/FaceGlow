import { NativeModules } from 'react-native';

const { ApplePayModule } = NativeModules;

export interface SubscriptionTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  cancelled?: boolean;
}

export class SubscriptionTester {
  // 测试订阅产品ID列表
  private static readonly SUBSCRIPTION_PRODUCT_IDS = [
    'com.digitech.faceglow.subscribe.monthly', 
    'com.digitech.faceglow.subscribe.yearly',
  ];

  // 测试金币产品ID列表
  private static readonly COIN_PRODUCT_IDS = [
    'com.digitech.faceglow.assets.coins',
  ];

  /**
   * 测试获取订阅产品信息
   */
  static async testGetSubscriptionProducts(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 开始测试获取订阅产品信息...');
      
      const products = await ApplePayModule.getAvailableProducts(this.SUBSCRIPTION_PRODUCT_IDS);
      
      console.log('✅ 订阅产品信息获取成功:', products);
      
      return {
        success: true,
        message: `成功获取 ${products.length} 个订阅产品`,
        data: products,
      };
    } catch (error: any) {
      console.error('❌ 获取订阅产品信息失败:', error);
      
      return {
        success: false,
        message: '获取订阅产品信息失败',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 测试获取金币产品信息
   */
  static async testGetCoinProducts(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 开始测试获取金币产品信息...');
      
      const products = await ApplePayModule.getAvailableProducts(this.COIN_PRODUCT_IDS);
      
      console.log('✅ 金币产品信息获取成功:', products);
      
      return {
        success: true,
        message: `成功获取 ${products.length} 个金币产品`,
        data: products,
      };
    } catch (error: any) {
      console.error('❌ 获取金币产品信息失败:', error);
      
      return {
        success: false,
        message: '获取金币产品信息失败',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 测试购买产品
   */
  static async testPurchaseProduct(productId: string): Promise<SubscriptionTestResult> {
    try {
      console.log(`🧪 开始测试购买产品: ${productId}`);
      
      const result = await ApplePayModule.purchaseProduct(productId);
      
      console.log('✅ 购买结果:', result);
      
      return {
        success: result.success || false,
        message: result.success ? '购买成功' : '购买失败',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ 购买失败:', error);
      
      // 检查是否是用户取消
      const isCancelled = error.message === '用户取消了购买' || error.code === 'purchase_cancelled';
      
      return {
        success: false,
        message: isCancelled ? '用户取消了购买' : '购买过程中出现错误',
        error: error.message || '未知错误',
        cancelled: isCancelled,
      };
    }
  }

  /**
   * 测试恢复购买
   */
  static async testRestorePurchases(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 开始测试恢复购买...');
      
      const result = await ApplePayModule.restorePurchases();
      
      console.log('✅ 恢复购买结果:', result);
      
      return {
        success: result.success || false,
        message: result.success ? '恢复购买成功' : '没有可恢复的购买',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ 恢复购买失败:', error);
      
      return {
        success: false,
        message: '恢复购买过程中出现错误',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 测试订阅状态检查
   */
  static async testSubscriptionStatus(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 开始测试订阅状态检查...');
      
      const status = await ApplePayModule.checkSubscriptionStatus();
      
      console.log('✅ 订阅状态:', status);
      
      return {
        success: true,
        message: '订阅状态检查成功',
        data: status,
      };
    } catch (error: any) {
      console.error('❌ 订阅状态检查失败:', error);
      
      return {
        success: false,
        message: '订阅状态检查过程中出现错误',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 运行完整测试套件
   */
  static async runFullTest(): Promise<SubscriptionTestResult[]> {
    console.log('🚀 开始运行完整订阅测试套件...');
    
    const results: SubscriptionTestResult[] = [];
    
    // 1. 测试获取产品信息
    const productsResult = await this.testGetProducts();
    results.push(productsResult);
    
    // 2. 测试订阅状态检查
    const statusResult = await this.testSubscriptionStatus();
    results.push(statusResult);
    
    // 3. 测试恢复购买
    const restoreResult = await this.testRestorePurchases();
    results.push(restoreResult);
    
    // 4. 测试购买（仅测试第一个产品）
    if (productsResult.success && productsResult.data?.length > 0) {
      const firstProduct = productsResult.data[0];
      const purchaseResult = await this.testPurchaseProduct(firstProduct.productIdentifier);
      results.push(purchaseResult);
    }
    
    console.log('📊 测试套件完成，结果汇总:', results);
    
    return results;
  }

  /**
   * 检查沙盒环境
   */
  static checkSandboxEnvironment(): SubscriptionTestResult {
    console.log('🔍 检查沙盒环境配置...');
    
    const checks = {
      hasApplePayModule: !!ApplePayModule,
      hasSubscriptionProductIds: this.SUBSCRIPTION_PRODUCT_IDS.length > 0,
      hasCoinProductIds: this.COIN_PRODUCT_IDS.length > 0,
      subscriptionProductIdsValid: this.SUBSCRIPTION_PRODUCT_IDS.every(id => id.startsWith('com.digitech.faceglow.subscription.')),
      coinProductIdsValid: this.COIN_PRODUCT_IDS.every(id => id.startsWith('com.digitech.faceglow.')),
    };
    
    const allChecksPass = Object.values(checks).every(check => check === true);
    
    console.log('🔍 沙盒环境检查结果:', checks);
    
    return {
      success: allChecksPass,
      message: allChecksPass ? '沙盒环境配置正确' : '沙盒环境配置有问题',
      data: checks,
    };
  }
}

export default SubscriptionTester;
