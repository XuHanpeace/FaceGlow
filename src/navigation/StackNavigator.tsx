import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import DetailScreen from '../screens/DetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import COSUploadTestScreen from '../screens/COSUploadTestScreen';
import DatabaseTestScreen from '../screens/DatabaseTestScreen';
import NewHomeScreen from '../screens/NewHomeScreen';
import BeforeCreationScreen from '../screens/BeforeCreationScreen';
import TemplateMarketScreen from '../screens/TemplateMarketScreen';
import NewProfileScreen from '../screens/NewProfileScreen';
import TestCenterScreen from '../screens/TestCenterScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTab" component={TabNavigator} />
      <Stack.Screen
        name="NewHome"
        component={NewHomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BeforeCreation"
        component={BeforeCreationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TemplateMarket"
        component={TemplateMarketScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NewProfile"
        component={NewProfileScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="TestCenter"
        component={TestCenterScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: true,
          headerBackTitle: '返回',
          title: '登录',
        }}
      />
      <Stack.Screen
        name="COSUploadTest"
        component={COSUploadTestScreen}
        options={{
          headerShown: true,
          headerBackTitle: '返回',
          title: 'COS上传测试',
        }}
      />
      <Stack.Screen
        name="DatabaseTest"
        component={DatabaseTestScreen}
        options={{
          headerShown: true,
          headerBackTitle: '返回',
          title: '数据库测试',
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
