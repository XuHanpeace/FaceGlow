import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { togglePanel, pollAsyncTask, removeTask } from '../store/slices/asyncTaskSlice';
import { fetchUserWorks } from '../store/slices/userWorksSlice';
import { TaskStatus } from '../types/model/user_works';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { showSuccessToast } from '../utils/toast';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { authService } from '../services/auth/authService';
// import { navigate } from '../navigation/navigationUtils'; // Removed

const { height } = Dimensions.get('window');

const AsyncTaskPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isPanelOpen } = useTypedSelector(state => state.asyncTask);
  
  // 用于记录已完成的任务ID，避免重复提示
  const completedTaskIdsRef = useRef<Set<string>>(new Set());

  const handleClose = () => {
    dispatch(togglePanel(false));
  };

  // 监听任务状态变化，当任务完成时显示Toast和震动，并刷新作品列表
  useEffect(() => {
    tasks.forEach(task => {
      // 检查任务是否刚完成（从PENDING变为SUCCESS）
      if (task.status === TaskStatus.SUCCESS && !completedTaskIdsRef.current.has(task.taskId)) {
        // 标记为已处理
        completedTaskIdsRef.current.add(task.taskId);
        
        // 显示Toast提示
        showSuccessToast('作品已生成完成，快去"我的作品"查看吧！', '创作完成');
        
        // 震动反馈
        try {
          ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        } catch (error) {
          console.warn('震动反馈失败:', error);
        }
        
        // 刷新作品列表，确保状态更新
        const currentUserId = authService.getCurrentUserId();
        if (currentUserId) {
          console.log('[AsyncTaskPanel] 任务完成，刷新作品列表');
          dispatch(fetchUserWorks({ uid: currentUserId }));
        }
      }
    });
  }, [tasks, dispatch]);

  // 轮询逻辑
  useEffect(() => {
    // 只要有 PENDING 任务，就开始轮询，不依赖面板打开状态
    const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
    if (pendingTasks.length === 0) return;

    const intervalId = setInterval(() => {
      pendingTasks.forEach(task => {
        dispatch(pollAsyncTask(task));
      });
    }, 3000); // 每3秒轮询一次

    return () => clearInterval(intervalId);
  }, [tasks, dispatch]); // 移除 isPanelOpen 依赖

  const renderItem = ({ item }: { item: any }) => {
    let statusIcon;
    let statusText;

    switch (item.status) {
      case TaskStatus.PENDING:
        statusIcon = <ActivityIndicator size="small" color="#00E096" />;
        statusText = '生成中...';
        break;
      case TaskStatus.SUCCESS:
        statusIcon = <FontAwesome name="check-circle" size={20} color="#00E096" />;
        statusText = '完成';
        break;
      case TaskStatus.FAILED:
        statusIcon = <FontAwesome name="exclamation-circle" size={20} color="#FF4D4F" />;
        statusText = '失败';
        break;
    }

    return (
      <View style={styles.taskItem}>
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={1}>{item.activityTitle}</Text>
          <Text style={styles.taskStatus}>{statusText}</Text>
          {item.error && <Text style={styles.errorText}>{item.error}</Text>}
        </View>
        <View style={styles.statusIcon}>
            {statusIcon}
        </View>
        {item.status !== TaskStatus.PENDING && (
            <TouchableOpacity 
                style={styles.closeBtn}
                onPress={() => dispatch(removeTask(item.taskId))}
            >
                <FontAwesome name="times" size={14} color="#999" />
            </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={isPanelOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>创作任务</Text>
              <Text style={styles.subtitle}>AI 正在努力创作中，预计耗时 1-3 分钟，请耐心等待...</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="angle-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={[...tasks].reverse()} // 最新在最前
            renderItem={renderItem}
            keyExtractor={item => item.taskId}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>暂无任务</Text>
              </View>
            }
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1E1E1E',
    height: height * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    marginBottom: 10,
  },
  coverImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  errorText: {
    fontSize: 10,
    color: '#FF4D4F',
    marginTop: 2,
  },
  statusIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  closeBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
});

export default AsyncTaskPanel;
