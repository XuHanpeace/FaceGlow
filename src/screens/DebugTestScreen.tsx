import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch } from '../store/hooks';
import { startAsyncTask, StartAsyncTaskPayload } from '../store/slices/asyncTaskSlice';
import { TaskType } from '../services/cloud/asyncTaskService';
import { authService } from '../services/auth/authService';
import { themeColors } from '../config/theme';
import BackButton from '../components/BackButton';

type DebugTestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DebugTestScreen: React.FC = () => {
  const navigation = useNavigation<DebugTestScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<string | null>(null);

  // Mock 数据
  const mockImageUrl = 'https://example.com/mock-image.jpg';
  const mockVideoUrl = 'https://example.com/mock-video.mp4';
  const mockPrompt = '测试提示词：生成一个美丽的风景';
  const mockActivityId = 'debug-activity-001';
  const mockTemplateId = 'debug-template-001';

  const getCurrentUserId = () => {
    const uid = authService.getCurrentUserId();
    if (!uid) {
      Alert.alert('错误', '请先登录');
      return null;
    }
    return uid;
  };

  const handleTestTask = async (taskType: TaskType, taskName: string) => {
    const uid = getCurrentUserId();
    if (!uid) return;

    setLoading(taskName);

    try {
      const payload: StartAsyncTaskPayload = {
        taskType,
        prompt: mockPrompt,
        activityId: mockActivityId,
        activityTitle: `调试测试 - ${taskName}`,
        activityDescription: `这是 ${taskName} 的调试测试`,
        uid,
        templateId: mockTemplateId,
        price: 0, // 免费测试
        ...(taskType === TaskType.IMAGE_TO_VIDEO && {
          images: [mockImageUrl],
          videoParams: {
            resolution: '720P',
          },
        }),
        ...(taskType === TaskType.VIDEO_EFFECT && {
          videoUrl: mockVideoUrl,
          videoParams: {
            resolution: '720P',
            template: 'frenchkiss', // 示例模板
          },
        }),
        ...(taskType === TaskType.PORTRAIT_STYLE_REDRAW && {
          images: [mockImageUrl],
          styleRedrawParams: {
            style_index: 0, // 使用预设风格
          },
        }),
      };

      const result = await dispatch(startAsyncTask(payload));
      
      if (startAsyncTask.fulfilled.match(result)) {
        Alert.alert('成功', `${taskName} 任务已启动`, [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const error = result.payload as any;
        Alert.alert('失败', error?.message || '任务启动失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error?.message || '发生未知错误');
    } finally {
      setLoading(null);
    }
  };

  const testButtons = [
    {
      title: '测试 Image2Video',
      subtitle: '图生视频',
      taskType: TaskType.IMAGE_TO_VIDEO,
      taskName: 'image2video',
      colors: themeColors.primary.gradient,
    },
    {
      title: '测试 Video Effect',
      subtitle: '视频特效 (img_video_effect)',
      taskType: TaskType.VIDEO_EFFECT,
      taskName: 'img_video_effect',
      colors: themeColors.secondary.gradient,
    },
    {
      title: '测试 Portrait Redraw',
      subtitle: '人像风格重绘 (img_repaint)',
      taskType: TaskType.PORTRAIT_STYLE_REDRAW,
      taskName: 'img_repaint',
      colors: themeColors.success.gradient,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>调试测试页面</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          使用 Mock 数据测试异步任务功能
        </Text>

        {testButtons.map((button, index) => {
          const isLoading = loading === button.taskName;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.buttonContainer}
              onPress={() => handleTestTask(button.taskType, button.taskName)}
              disabled={loading !== null}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={button.colors}
                start={themeColors.primary.start}
                end={themeColors.primary.end}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonTitle}>{button.title}</Text>
                    <Text style={styles.buttonSubtitle}>{button.subtitle}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Mock 数据说明：</Text>
          <Text style={styles.infoText}>• 图片URL: {mockImageUrl}</Text>
          <Text style={styles.infoText}>• 视频URL: {mockVideoUrl}</Text>
          <Text style={styles.infoText}>• 提示词: {mockPrompt}</Text>
          <Text style={styles.infoText}>• 活动ID: {mockActivityId}</Text>
          <Text style={styles.infoText}>• 模板ID: {mockTemplateId}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 5,
  },
});

export default DebugTestScreen;
