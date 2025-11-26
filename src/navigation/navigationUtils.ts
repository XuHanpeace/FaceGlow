import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList } from '../types/navigation';

// 创建一个导航引用
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

// 导航到指定屏幕
export function navigate(name: string, params?: object) {
  navigationRef.current?.navigate(name, params);
}

// 返回上一个屏幕
export function goBack() {
  navigationRef.current?.goBack();
}

// 重置导航到指定路由
export function reset(name: string, params?: object) {
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name, params }],
  });
}

// 压入新的路由
export function push(name: string, params?: object) {
  navigationRef.current?.navigate(name, params);
} 