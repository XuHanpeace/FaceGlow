import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import DetailScreen from '../screens/DetailScreen';

export type RootStackParamList = {
  MainTab: undefined;
  Detail: {
    id: string;
    title: string;
    content: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="MainTab" component={TabNavigator} />
      <Stack.Screen 
        name="Detail" 
        component={DetailScreen}
        options={{
          headerShown: true,
          headerBackTitle: '返回',
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator; 