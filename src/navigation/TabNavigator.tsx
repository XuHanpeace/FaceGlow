/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Image, StatusBar, useColorScheme } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import CreateScreen from '../screens/CreateScreen';
import MessageScreen from '../screens/MessageScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: isDarkMode ? '#fff' : '#1890ff',
          tabBarInactiveTintColor: isDarkMode ? '#666' : '#999',
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: isDarkMode ? '#000' : '#fff',
              borderTopColor: isDarkMode ? '#333' : '#eee',
            }
          ],
          tabBarItemStyle: {
            paddingVertical: 8,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: '首页',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  isDarkMode
                    ? focused
                      ? require('../assets/icons/home-dark-active.png')
                      : require('../assets/icons/home-dark.png')
                    : focused
                      ? require('../assets/icons/home-active.png')
                      : require('../assets/icons/home.png')
                }
                style={styles.icon}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarLabel: '动态',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  isDarkMode
                    ? focused
                      ? require('../assets/icons/compass-dark-active.png')
                      : require('../assets/icons/compass-dark.png')
                    : focused
                      ? require('../assets/icons/compass-active.png')
                      : require('../assets/icons/compass.png')
                }
                style={styles.icon}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Create"
          component={CreateScreen}
          options={{
            tabBarLabel: '创建',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  isDarkMode
                    ? focused
                      ? require('../assets/icons/plus-dark-active.png')
                      : require('../assets/icons/plus-dark.png')
                    : focused
                      ? require('../assets/icons/plus-active.png')
                      : require('../assets/icons/plus.png')
                }
                style={[styles.icon, styles.createIcon]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Message"
          component={MessageScreen}
          options={{
            tabBarLabel: '消息',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  isDarkMode
                    ? focused
                      ? require('../assets/icons/message-dark-active.png')
                      : require('../assets/icons/message-dark.png')
                    : focused
                      ? require('../assets/icons/message-active.png')
                      : require('../assets/icons/message.png')
                }
                style={styles.icon}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: '我的',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  isDarkMode
                    ? focused
                      ? require('../assets/icons/profile-dark-active.png')
                      : require('../assets/icons/profile-dark.png')
                    : focused
                      ? require('../assets/icons/profile-active.png')
                      : require('../assets/icons/profile.png')
                }
                style={styles.icon}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 5,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  createIcon: {
    width: 28,
    height: 28,
  },
});

export default TabNavigator; 