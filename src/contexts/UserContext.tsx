import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService } from '../services/userService';
import { User, UserStats } from '../types/user';

// 用户上下文接口
interface UserContextType {
  // 用户状态
  currentUser: User | null;
  userStats: UserStats | null;
  isLoading: boolean;
  
  // 用户操作
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUserStats: () => Promise<void>;
  
  // 用户信息
  isLoggedIn: boolean;
  isAnonymous: boolean;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 用户提供者组件
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化用户
  useEffect(() => {
    initializeUser();
  }, []);

  // 初始化用户
  const initializeUser = async () => {
    try {
      setIsLoading(true);
      
      // 尝试获取现有用户
      const existingUser = await userService.getCurrentUser();
      
      if (existingUser) {
        setCurrentUser(existingUser);
        // 获取用户统计
        const stats = await userService.getUserStats(existingUser.id);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('初始化用户失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录（匿名登录）
  const login = async () => {
    try {
      setIsLoading(true);
      
      // 获取或创建匿名用户
      const user = await userService.getOrCreateAnonymousUser();
      setCurrentUser(user);
      
      // 获取用户统计
      const stats = await userService.getUserStats(user.id);
      setUserStats(stats);
      
      console.log('用户登录成功:', user);
    } catch (error) {
      console.error('用户登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      if (currentUser) {
        // 清理用户数据
        await userService.clearUserStats(currentUser.id);
      }
      
      setCurrentUser(null);
      setUserStats(null);
      
      console.log('用户登出成功');
    } catch (error) {
      console.error('用户登出失败:', error);
    }
  };

  // 更新用户信息
  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!currentUser) {
        throw new Error('用户未登录');
      }
      
      const updatedUser = await userService.updateUser(updates);
      setCurrentUser(updatedUser);
      
      console.log('用户信息更新成功:', updatedUser);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  };

  // 刷新用户统计
  const refreshUserStats = async () => {
    try {
      if (!currentUser) {
        return;
      }
      
      const stats = await userService.getUserStats(currentUser.id);
      setUserStats(stats);
    } catch (error) {
      console.error('刷新用户统计失败:', error);
    }
  };

  // 计算派生状态
  const isLoggedIn = !!currentUser;
  const isAnonymous = currentUser?.isAnonymous || false;

  // 上下文值
  const contextValue: UserContextType = {
    currentUser,
    userStats,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUserStats,
    isLoggedIn,
    isAnonymous,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// 使用用户上下文的 Hook
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// 导出上下文
export default UserContext;
