import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import HeaderSection from '../components/HeaderSection';

const MessageScreen = () => {
  const messages = [
    { id: '1', title: '系统通知', time: '刚刚' },
    { id: '2', title: '新的消息', time: '5分钟前' },
    { id: '3', title: '活动提醒', time: '1小时前' },
  ];

  return (
    <View style={styles.container}>
      <HeaderSection
        title="消息中心"
        subtitle="通知与提醒"
        description="查看您的所有消息、通知和互动提醒。"
      />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{item.time}</Text>
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