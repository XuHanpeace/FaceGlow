import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { togglePanel } from '../store/slices/asyncTaskSlice';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { TaskStatus } from '../types/model/user_works';

const { width } = Dimensions.get('window');

const AsyncTaskFloatBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isPanelOpen } = useTypedSelector(state => state.asyncTask);
  
  // 过滤出正在进行或刚刚完成的任务（未读状态逻辑暂未实现，简单展示所有或仅进行中）
  // 需求：展示当前正在运行几个 async task
  const runningTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
  const runningCount = runningTasks.length;

  // 如果没有正在运行的任务且面板未打开，可以隐藏或者显示历史任务入口？
  // 假设只在有运行任务时显示，或者常驻但状态不同
  if (runningCount === 0 && !isPanelOpen) return null;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => dispatch(togglePanel(true))}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.indicator}>
          <View style={[styles.dot, { backgroundColor: runningCount > 0 ? '#00E096' : '#ccc' }]} />
        </View>
        <Text style={styles.text}>
          {runningCount > 0 ? `${runningCount} 个创作任务进行中...` : '任务列表'}
        </Text>
        <FontAwesome name="chevron-up" size={12} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // TabBar上方
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: width * 0.6,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indicator: {
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default AsyncTaskFloatBar;

