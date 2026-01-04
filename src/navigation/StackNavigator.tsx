import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NewHomeScreen from '../screens/NewHomeScreen';
import BeforeCreationScreen from '../screens/BeforeCreationScreen';
import CreationResultScreen from '../screens/CreationResultScreen';
import AlbumMarketScreen from '../screens/AlbumMarketScreen';
import NewProfileScreen from '../screens/NewProfileScreen';
import SelfieGuideScreen from '../screens/SelfieGuideScreen';
import NewAuthScreen from '../screens/NewAuthScreen';
import VerificationCodeScreen from '../screens/VerificationCodeScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CoinPurchaseScreen from '../screens/CoinPurchaseScreen';
import UserWorkPreviewScreen from '../screens/UserWorkPreviewScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import WebViewScreen from '../screens/WebViewScreen';
import VideoTestScreen from '../screens/VideoTestScreen';
import DebugTestScreen from '../screens/DebugTestScreen';
import CheckInScreen from '../screens/CheckInScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="NewHome"
      screenOptions={{
        headerShown: false,
      }}
    >
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
        name="CreationResult"
        component={CreationResultScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AlbumMarket"
        component={AlbumMarketScreen}
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
        name="SelfieGuide"
        component={SelfieGuideScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />

      <Stack.Screen
        name="NewAuth"
        component={NewAuthScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="VerificationCode"
        component={VerificationCodeScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="CoinPurchase"
        component={CoinPurchaseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="UserWorkPreview"
        component={UserWorkPreviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AboutUs"
        component={AboutUsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="VideoTest"
        component={VideoTestScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="DebugTest"
        component={DebugTestScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 250,
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
