import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CheckInData {
  version: number;
  ts: number;
  weekStart: string; // YYYY-MM-DD 格式的周一日期
  checkIns: boolean[]; // 长度为7的数组，索引0-6对应周一到周日
  lastCheckInDate?: string; // 最后一次签到的日期
}

const CACHE_VERSION = 1;
const STORAGE_KEY = 'fg_checkin_data_v1';

/**
 * 签到服务
 */
class CheckInService {
  /**
   * 获取当前周的开始日期（周一）
   * @returns YYYY-MM-DD 格式的日期字符串
   */
  getCurrentWeekStart(): string {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const date = String(monday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${date}`;
  }

  /**
   * 获取今天是星期几（0=周一, 6=周日）
   */
  getTodayDayOfWeek(): number {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // 转换为 0=Monday, 6=Sunday
    return day === 0 ? 6 : day - 1;
  }

  /**
   * 获取今天的日期字符串（YYYY-MM-DD）
   */
  getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  /**
   * 根据星期几和连续签到天数计算奖励金额
   * @param dayOfWeek 0=周一, 6=周日
   * @param consecutiveDays 连续签到天数（默认0）
   * @returns 奖励金额
   */
  getRewardAmount(dayOfWeek: number, consecutiveDays: number = 0): number {
    // 周一到周五：10美美币
    if (dayOfWeek >= 0 && dayOfWeek <= 4) {
      return 10;
    }
    // 周六：20美美币（需要连续签到至少5天）
    if (dayOfWeek === 5) {
      return consecutiveDays >= 5 ? 20 : 10;
    }
    // 周日：30美美币（需要连续签到至少6天）
    if (dayOfWeek === 6) {
      return consecutiveDays >= 6 ? 30 : 10;
    }
    return 10; // 默认10
  }

  /**
   * 获取当前周的签到数据
   */
  async getCheckInData(): Promise<CheckInData | null> {
    try {
      const cachedStr = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!cachedStr) {
        return null;
      }
      
      const data = JSON.parse(cachedStr) as CheckInData;
      
      // 校验version
      if (data.version !== CACHE_VERSION) {
        return null;
      }
      
      // 校验数据结构
      if (!data.weekStart || !Array.isArray(data.checkIns) || data.checkIns.length !== 7) {
        return null;
      }
      
      // 检查是否是当前周
      const currentWeekStart = this.getCurrentWeekStart();
      if (data.weekStart !== currentWeekStart) {
        // 跨周了，返回null，需要重新初始化
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('[checkInService] 读取签到数据失败:', error);
      return null;
    }
  }

  /**
   * 初始化或重置当前周的签到数据
   */
  async initializeWeekData(): Promise<CheckInData> {
    const weekStart = this.getCurrentWeekStart();
    const data: CheckInData = {
      version: CACHE_VERSION,
      ts: Date.now(),
      weekStart,
      checkIns: [false, false, false, false, false, false, false], // 周一到周日
    };
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[checkInService] 初始化签到数据失败:', error);
    }
    
    return data;
  }

  /**
   * 获取或初始化当前周的签到数据
   */
  async getOrInitializeCheckInData(): Promise<CheckInData> {
    let data = await this.getCheckInData();
    if (!data) {
      data = await this.initializeWeekData();
    }
    return data;
  }

  /**
   * 检查今天是否已签到
   */
  async hasCheckedInToday(): Promise<boolean> {
    try {
      const data = await this.getOrInitializeCheckInData();
      const dayOfWeek = this.getTodayDayOfWeek();
      return data.checkIns[dayOfWeek] === true;
    } catch (error) {
      console.error('[checkInService] 检查签到状态失败:', error);
      return false;
    }
  }

  /**
   * 执行签到
   * @returns { success: boolean; rewardAmount?: number; error?: string }
   */
  async checkInToday(): Promise<{
    success: boolean;
    rewardAmount?: number;
    error?: string;
  }> {
    try {
      // 检查是否已签到
      const hasCheckedIn = await this.hasCheckedInToday();
      if (hasCheckedIn) {
        return {
          success: false,
          error: '今天已经签到过了',
        };
      }

      // 获取或初始化数据
      const data = await this.getOrInitializeCheckInData();
      const dayOfWeek = this.getTodayDayOfWeek();
      
      // 计算连续签到天数（在签到前）
      const consecutiveDays = this.calculateConsecutiveDays(data.checkIns, dayOfWeek);
      
      // 根据连续签到天数计算奖励
      const rewardAmount = this.getRewardAmount(dayOfWeek, consecutiveDays);
      const todayDate = this.getTodayDateString();

      // 更新签到状态
      data.checkIns[dayOfWeek] = true;
      data.lastCheckInDate = todayDate;
      data.ts = Date.now();

      // 保存到本地存储
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('[checkInService] 保存签到数据失败:', error);
        return {
          success: false,
          error: '保存签到数据失败',
        };
      }

      console.log('✅ 签到成功:', { dayOfWeek, rewardAmount, todayDate });

      return {
        success: true,
        rewardAmount,
      };
    } catch (error: any) {
      console.error('[checkInService] 签到失败:', error);
      return {
        success: false,
        error: error.message || '签到失败',
      };
    }
  }

  /**
   * 获取当前周的签到状态数组
   * @returns boolean[] 长度为7的数组，索引0-6对应周一到周日
   */
  async getWeekCheckInStatus(): Promise<boolean[]> {
    try {
      const data = await this.getOrInitializeCheckInData();
      return [...data.checkIns]; // 返回副本
    } catch (error) {
      console.error('[checkInService] 获取签到状态失败:', error);
      return [false, false, false, false, false, false, false];
    }
  }

  /**
   * 计算连续签到天数
   * @param checkIns 签到状态数组
   * @param dayOfWeek 当前是星期几（0=周一, 6=周日）
   * @returns 连续签到天数
   */
  calculateConsecutiveDays(checkIns: boolean[], dayOfWeek: number): number {
    let consecutive = 0;
    // 从今天往前数连续签到的天数
    for (let i = dayOfWeek; i >= 0; i--) {
      if (checkIns[i]) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }
}

export const checkInService = new CheckInService();

