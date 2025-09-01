import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type NavigationItem = 'discover' | 'daily' | 'new' | 'create';

interface HomeNavigationProps {
  activeTab: NavigationItem;
  onTabPress: (tab: NavigationItem) => void;
}

const HomeNavigation: React.FC<HomeNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const navigationItems = [
    { id: 'discover' as NavigationItem, label: 'Discover', icon: '🔍' },
    { id: 'daily' as NavigationItem, label: 'Daily Shots', icon: '📅', badge: '9' },
    { id: 'new' as NavigationItem, label: 'New', icon: '⚡' },
    { id: 'create' as NavigationItem, label: 'Create', icon: '⭐' },
  ];

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.tabButton,
            activeTab === item.id && styles.activeTabButton,
          ]}
          onPress={() => onTabPress(item.id)}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{item.icon}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === item.id && styles.activeTabLabel,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
  },
  activeTabButton: {
    backgroundColor: '#fff',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#333',
  },
});

export default HomeNavigation;
