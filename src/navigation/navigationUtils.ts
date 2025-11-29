import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList } from '../types/navigation';

// 创建一个导航引用
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

// 导航到指定屏幕
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  ...args: RootStackParamList[RouteName] extends undefined
    ? []
    : [RootStackParamList[RouteName]]
) {
  const params = args[0];
  if (params !== undefined) {
    (navigationRef.current?.navigate as (name: RouteName, params: RootStackParamList[RouteName]) => void)(
      name,
      params
    );
  } else {
    (navigationRef.current?.navigate as (name: RouteName) => void)(name);
  }
}

// 返回上一个屏幕
export function goBack() {
  navigationRef.current?.goBack();
}

// 重置导航到指定路由
export function reset<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName] extends undefined
    ? undefined
    : RootStackParamList[RouteName]
) {
  navigationRef.current?.reset({
    index: 0,
    routes: [
      {
        name,
        params,
      },
    ] as never,
  });
}

// 压入新的路由
export function push<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  ...args: RootStackParamList[RouteName] extends undefined
    ? []
    : [RootStackParamList[RouteName]]
) {
  const params = args[0];
  if (params !== undefined) {
    (navigationRef.current?.navigate as (name: RouteName, params: RootStackParamList[RouteName]) => void)(
      name,
      params
    );
  } else {
    (navigationRef.current?.navigate as (name: RouteName) => void)(name);
  }
} 