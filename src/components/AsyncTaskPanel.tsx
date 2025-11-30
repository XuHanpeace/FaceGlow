import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { togglePanel, pollAsyncTask, removeTask } from '../store/slices/asyncTaskSlice';
import { TaskStatus } from '../types/model/user_works';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { navigate } from '../navigation/navigationUtils';

const { height } = Dimensions.get('window');

const AsyncTaskPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isPanelOpen } = useTypedSelector(state => state.asyncTask);

  const handleClose = () => {
    dispatch(togglePanel(false));
  };

  // 轮询逻辑
  useEffect(() => {
    if (!isPanelOpen) return;

    const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
    if (pendingTasks.length === 0) return;

    const intervalId = setInterval(() => {
      pendingTasks.forEach(task => {
        dispatch(pollAsyncTask(task));
      });
    }, 3000); // 每3秒轮询一次

    return () => clearInterval(intervalId);
  }, [isPanelOpen, tasks, dispatch]);

  const handleTaskPress = (task: any) => {
    if (task.status === TaskStatus.SUCCESS) {
        handleClose();
        // 跳转到作品预览页
        navigate('UserWorkPreview', {
            initialWorkId: task.workId
        });
    }
  };

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
      <TouchableOpacity 
        style={styles.taskItem} 
        onPress={() => handleTaskPress(item)}
        disabled={item.status === TaskStatus.PENDING}
      >
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
      </TouchableOpacity>
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
            <Text style={styles.title}>创作任务</Text>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="times" size={20} color="#333" />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fff',
    height: height * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
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
    color: '#333',
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 12,
    color: '#666',
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
    color: '#999',
    fontSize: 14,
  },
});

export default AsyncTaskPanel;

