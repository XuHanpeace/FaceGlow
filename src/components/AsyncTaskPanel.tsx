import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { togglePanel, pollAsyncTask, removeTask, type AsyncTask } from '../store/slices/asyncTaskSlice';
import { fetchUserWorks } from '../store/slices/userWorksSlice';
import { TaskStatus, type UserWorkModel } from '../types/model/user_works';
import { TaskType } from '../services/cloud/asyncTaskService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { showSuccessToast } from '../utils/toast';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { authService } from '../services/auth/authService';
import { userWorkService } from '../services/database/userWorkService';
import { navigate } from '../navigation/navigationUtils';

// 辅助函数：从任务中获取 task_type
function getTaskType(task: AsyncTask): TaskType | null {
  // 优先从 updatedWork.ext_data 中获取
  if (task.updatedWork?.ext_data) {
    try {
      const extData = JSON.parse(task.updatedWork.ext_data) as Record<string, unknown>;
      const taskType = extData.task_type;
      if (typeof taskType === 'string') {
        return taskType as TaskType;
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  return null;
}

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.includes('.mp4?');
}

function pickCoverImage(task: AsyncTask): string {
  const coverFromTask = typeof task.coverImage === 'string' ? task.coverImage : '';
  // 如果 coverImage 是视频（比如被错误设置为 preview_video_url），兜底到图片字段
  if (coverFromTask && !isVideoUrl(coverFromTask)) return coverFromTask;

  const work = task.updatedWork;
  if (work) {
    if (work.activity_image && !isVideoUrl(work.activity_image)) return work.activity_image;
    const templateImage = work.result_data?.[0]?.template_image;
    if (templateImage && !isVideoUrl(templateImage)) return templateImage;

    // ext_data 里可能存 selfie_url
    try {
      const extData = JSON.parse(work.ext_data) as Record<string, unknown>;
      const selfieUrl = extData.selfie_url;
      if (typeof selfieUrl === 'string' && selfieUrl && !isVideoUrl(selfieUrl)) return selfieUrl;
    } catch {
      // ignore
    }
  }

  // 最后兜底：空字符串（UI 将显示空态）
  return '';
}

function pickSelfieBadgeUrl(task: AsyncTask): string | null {
  const work = task.updatedWork;
  if (!work?.ext_data) return null;
  try {
    const extData = JSON.parse(work.ext_data) as Record<string, unknown>;
    const selfieUrl = extData.selfie_url;
    return typeof selfieUrl === 'string' ? selfieUrl : null;
  } catch {
    return null;
  }
}

function extractWorkRecord(data: unknown): UserWorkModel | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const maybeRecord = record.record;
  if (maybeRecord && typeof maybeRecord === 'object') return maybeRecord as UserWorkModel;
  return data as UserWorkModel;
}

const { height } = Dimensions.get('window');

const AsyncTaskPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isPanelOpen } = useTypedSelector(state => state.asyncTask);
  
  // 用于记录已完成的任务ID，避免重复提示
  const completedTaskIdsRef = useRef<Set<string>>(new Set());

  // 反转任务列表，最新在最前
  const reversedTasks = useMemo(() => [...tasks].reverse(), [tasks]);

  // 过滤可忽略的错误
  const isIgnorableError = (msg: string | undefined): boolean => {
    if (!msg) return true;
    const lower = msg.toLowerCase();
    return lower.includes('network error') || lower.includes('timeout') || lower.includes('查询任务失败');
  };

  // 打开作品预览
  const openWorkPreview = async (task: AsyncTask) => {
    try {
      // 优先使用 task.updatedWork，否则通过 taskId 获取
      let work: UserWorkModel | null = task.updatedWork ?? null;
      if (!work && task.taskId) {
        const result = await userWorkService.getWorkByTaskId(task.taskId);
        if (result.success && result.data) {
          work = extractWorkRecord(result.data);
        }
      }
      
      if (work) {
        dispatch(togglePanel(false));
        navigate('UserWorkPreview', { 
          work, 
          initialWorkId: work._id 
        });
      }
    } catch (error) {
      console.error('[AsyncTaskPanel] 打开预览失败:', error);
    }
  };

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
        
        // 刷新作品列表，确保状态更新（uid 在底层自动获取）
        console.log('[AsyncTaskPanel] 任务完成，刷新作品列表');
        dispatch(fetchUserWorks());
      }
    });
  }, [tasks, dispatch]);

  // 轮询逻辑
  useEffect(() => {
    // 只要有 PENDING 任务，就开始轮询，不依赖面板打开状态
    // 排除 doubao 任务（doubao 任务不需要轮询，它在后台同步处理）
    const pendingTasks = tasks.filter(t => {
      if (t.status !== TaskStatus.PENDING) return false;
      // 通过 task_type 判断是否为 doubao 任务
      const taskType = getTaskType(t);
      return taskType !== TaskType.DOUBAO_IMAGE_TO_IMAGE;
    });
    if (pendingTasks.length === 0) return;

    const intervalId = setInterval(() => {
      pendingTasks.forEach(task => {
        dispatch(pollAsyncTask(task));
      });
    }, 3000); // 每3秒轮询一次

    return () => clearInterval(intervalId);
  }, [tasks, dispatch]); // 移除 isPanelOpen 依赖

  const renderItem = ({ item }: { item: AsyncTask }) => {
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

    const selfieUrl = pickSelfieBadgeUrl(item);
    const coverImage = pickCoverImage(item);

    // 判断是否可打开预览
    const canOpenPreview = item.status === TaskStatus.SUCCESS;

    return (
      <TouchableOpacity 
        style={[styles.taskItem, !canOpenPreview && styles.taskItemDisabled]}
        activeOpacity={canOpenPreview ? 0.85 : 1}
        onPress={canOpenPreview ? () => openWorkPreview(item) : undefined}
      >
        <View style={styles.coverWrap}>
          {!!coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: '#1A1A1A' }]} />
          )}
          {selfieUrl ? (
            <View style={styles.selfieBadge}>
              <Image source={{ uri: selfieUrl }} style={styles.selfieBadgeImg} />
            </View>
          ) : null}
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={1}>{item.activityTitle}</Text>
          <Text style={styles.taskStatus}>{statusText}</Text>
          {!!item.error && !isIgnorableError(item.error) && (
            <Text style={styles.errorText}>{item.error}</Text>
          )}
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
            <View>
              <Text style={styles.title}>创作任务</Text>
              <Text style={styles.subtitle}>AI 正在努力创作中，预计耗时 1-3 分钟，请耐心等待...</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="angle-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={reversedTasks}
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
  taskItemDisabled: {
    opacity: 0.75,
  },
  coverWrap: {
    position: 'relative',
    marginRight: 12,
  },
  coverImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  selfieBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E1E1E',
    overflow: 'hidden',
    backgroundColor: '#2C2C2C',
  },
  selfieBadgeImg: {
    width: '100%',
    height: '100%',
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
