/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Image, StatusBar, useColorScheme } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: isDarkMode ? '#fff' : '#000',
          tabBarInactiveTintColor: isDarkMode ? '#666' : '#999',
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: isDarkMode ? '#000' : '#fff',
              borderTopColor: isDarkMode ? '#333' : '#eee',
            },
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
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? {
                        uri: 'https://img.icons8.com/?size=100&id=TzMnSwiJW8HO&format=png&color=000000',
                      }
                    : {
                        uri: 'https://img.icons8.com/?size=100&id=JvzawTJthRcR&format=png&color=000000',
                      }
                }
                style={styles.icon}
              />
            ),
          }}
        />
        {/* <Tab.Screen
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
        /> */}
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? {
                        uri: 'https://img.icons8.com/?size=100&id=151IAtg8gTZE&format=png&color=000000',
                      }
                    : {
                        uri: 'https://img.icons8.com/?size=100&id=YRJN4lBDhzh8&format=png&color=000000',
                      }
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
    height: 44,
    paddingBottom: 8,
    paddingTop: 5,
  },
  icon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  createIcon: {
    width: 28,
    height: 28,
  },
});

export default TabNavigator;
