import React from 'react';
import { View, Text, StyleSheet, FlatList, useColorScheme } from 'react-native';
import HeaderSection from '../components/HeaderSection';

const MessageScreen = () => {
  const colorScheme = useColorScheme();
  const messages = [
    { id: '1', title: '系统通知', time: '刚刚' },
    { id: '2', title: '新的消息', time: '5分钟前' },
    { id: '3', title: '活动提醒', time: '1小时前' },
  ];

  return (
    <View style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }
    ]}>
      <HeaderSection
        title="消息中心"
        subtitle="通知与提醒"
        description="查看您的所有消息、通知和互动提醒。"
      />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageItem,
            { borderBottomColor: colorScheme === 'dark' ? '#333333' : '#eeeeee' }
          ]}>
            <Text style={[
              styles.title,
              { color: colorScheme === 'dark' ? '#FFFFFF' : '#333333' }
            ]}>{item.title}</Text>
            <Text style={[
              styles.time,
              { color: colorScheme === 'dark' ? '#999999' : '#999999' }
            ]}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

export default MessageScreen; 