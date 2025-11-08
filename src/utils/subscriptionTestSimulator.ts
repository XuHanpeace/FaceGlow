import { Platform } from 'react-native';

export interface SubscriptionTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SubscriptionTesterSimulator {
  // 模拟产品数据
  private static readonly MOCK_PRODUCTS = [
    {
        productIdentifier: 'com.digitech.faceglow.subscribe.monthly1',
      localizedTitle: '月度会员',
      localizedDescription: '解锁所有AI功能',
      price: 28.0,
      priceLocale: 'CNY',
    },
    {
        productIdentifier: 'com.digitech.faceglow.subscribe.yearly',
      localizedTitle: '年度会员',
      localizedDescription: '最优惠的选择',
      price: 328.0,
      priceLocale: 'CNY',
    },
    {
        productIdentifier: 'com.digitech.faceglow.assets.coins',
      localizedTitle: 'Face Coins',
      localizedDescription: '解锁AI创作功能',
      price: 6.0,
      priceLocale: 'CNY',
    },
  ];

  // 模拟订阅状态
  private static readonly MOCK_SUBSCRIPTION_STATUS = {
    isSubscribed: false,
    subscriptionType: '',
    expirationDate: '',
  };

  /**
   * 检查是否在模拟器环境
   */
  static isSimulator(): boolean {
    return Platform.OS === 'ios' && __DEV__;
  }

  /**
   * 模拟获取产品信息
   */
  static async testGetProducts(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 [模拟器] 开始测试获取产品信息...');
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ [模拟器] 产品信息获取成功:', this.MOCK_PRODUCTS);
      
      return {
        success: true,
        message: `[模拟器] 成功获取 ${this.MOCK_PRODUCTS.length} 个产品`,
        data: this.MOCK_PRODUCTS,
      };
    } catch (error: any) {
      console.error('❌ [模拟器] 获取产品信息失败:', error);
      
      return {
        success: false,
        message: '[模拟器] 获取产品信息失败',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 模拟购买产品
   */
  static async testPurchaseProduct(productId: string): Promise<SubscriptionTestResult> {
    try {
      console.log(`🧪 [模拟器] 开始测试购买产品: ${productId}`);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟购买结果
      const mockResult = {
        success: true,
        productId: productId,
        transactionId: `mock_transaction_${Date.now()}`,
        purchaseDate: new Date().toISOString(),
      };
      
      console.log('✅ [模拟器] 购买结果:', mockResult);
      
      return {
        success: true,
        message: '[模拟器] 购买成功',
        data: mockResult,
      };
    } catch (error: any) {
      console.error('❌ [模拟器] 购买失败:', error);
      
      return {
        success: false,
        message: '[模拟器] 购买过程中出现错误',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 模拟恢复购买
   */
  static async testRestorePurchases(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 [模拟器] 开始测试恢复购买...');
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟恢复结果
      const mockResult = {
        success: true,
        message: '恢复购买完成',
        restoredTransactions: [],
      };
      
      console.log('✅ [模拟器] 恢复购买结果:', mockResult);
      
      return {
        success: true,
        message: '[模拟器] 恢复购买成功',
        data: mockResult,
      };
    } catch (error: any) {
      console.error('❌ [模拟器] 恢复购买失败:', error);
      
      return {
        success: false,
        message: '[模拟器] 恢复购买过程中出现错误',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 模拟订阅状态检查
   */
  static async testSubscriptionStatus(): Promise<SubscriptionTestResult> {
    try {
      console.log('🧪 [模拟器] 开始测试订阅状态检查...');
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('✅ [模拟器] 订阅状态:', this.MOCK_SUBSCRIPTION_STATUS);
      
      return {
        success: true,
        message: '[模拟器] 订阅状态检查成功',
        data: this.MOCK_SUBSCRIPTION_STATUS,
      };
    } catch (error: any) {
      console.error('❌ [模拟器] 订阅状态检查失败:', error);
      
      return {
        success: false,
        message: '[模拟器] 订阅状态检查过程中出现错误',
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 检查模拟器环境
   */
  static checkSimulatorEnvironment(): SubscriptionTestResult {
    console.log('🔍 [模拟器] 检查模拟器环境配置...');
    
    const checks = {
      isSimulator: this.isSimulator(),
      hasMockProducts: this.MOCK_PRODUCTS.length > 0,
      platform: Platform.OS,
      isDev: __DEV__,
    };
    
    const allChecksPass = Object.values(checks).every(check => check === true);
    
    console.log('🔍 [模拟器] 模拟器环境检查结果:', checks);
    
    return {
      success: allChecksPass,
      message: allChecksPass ? '[模拟器] 模拟器环境配置正确' : '[模拟器] 模拟器环境配置有问题',
      data: checks,
    };
  }

  /**
   * 运行完整测试套件（模拟器版本）
   */
  static async runFullTest(): Promise<SubscriptionTestResult[]> {
    console.log('🚀 [模拟器] 开始运行完整订阅测试套件...');
    
    const results: SubscriptionTestResult[] = [];
    
    // 1. 测试环境检查
    const environmentResult = this.checkSimulatorEnvironment();
    results.push(environmentResult);
    
    // 2. 测试获取产品信息
    const productsResult = await this.testGetProducts();
    results.push(productsResult);
    
    // 3. 测试订阅状态检查
    const statusResult = await this.testSubscriptionStatus();
    results.push(statusResult);
    
    // 4. 测试恢复购买
    const restoreResult = await this.testRestorePurchases();
    results.push(restoreResult);
    
    // 5. 测试购买（仅测试第一个产品）
    if (productsResult.success && productsResult.data?.length > 0) {
      const firstProduct = productsResult.data[0];
      const purchaseResult = await this.testPurchaseProduct(firstProduct.productIdentifier);
      results.push(purchaseResult);
    }
    
    console.log('📊 [模拟器] 测试套件完成，结果汇总:', results);
    
    return results;
  }
}

export default SubscriptionTesterSimulator;
