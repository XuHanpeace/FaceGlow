import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { togglePanel } from '../store/slices/asyncTaskSlice';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { TaskStatus } from '../types/model/user_works';

const { width, height } = Dimensions.get('window');

const AsyncTaskFloatBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isPanelOpen } = useTypedSelector(state => state.asyncTask);
  
  const runningTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
  const runningCount = runningTasks.length;

  // 初始位置：右下方
  const pan = useRef(new Animated.ValueXY({ x: width - 150, y: height - 180 })).current;
  
  // 解决点击 vs 拖拽冲突
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // 移动距离超过阈值视为拖拽
        return Math.abs(dx) > 5 || Math.abs(dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        isDragging.current = true;
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(e, gestureState);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        
        // 拖拽结束，延迟重置状态，确保点击事件不被误判
        setTimeout(() => {
             isDragging.current = false;
        }, 100);
      }
    })
  ).current;

  const handlePress = () => {
      if (!isDragging.current) {
          dispatch(togglePanel(true));
      }
  };

  if (runningCount === 0 && !isPanelOpen) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.content}
      >
        <View style={[styles.dot, { backgroundColor: runningCount > 0 ? '#00E096' : '#ccc' }]} />
        <Text style={styles.text}>
          {runningCount > 0 ? `${runningCount} 个任务进行中` : '任务列表'}
        </Text>
        <FontAwesome name="angle-up" size={12} color="#fff" style={styles.icon} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  icon: {
    marginLeft: 6,
  }
});

export default AsyncTaskFloatBar;
