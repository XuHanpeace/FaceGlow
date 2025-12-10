import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BackButton from '../components/BackButton';
import { TaskType } from '../services/cloud/asyncTaskService';
import { useAppDispatch } from '../store/hooks';
import { startAsyncTask } from '../store/slices/asyncTaskSlice';
import { authService } from '../services/auth/authService';

type VideoTestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VideoTestScreen: React.FC = () => {
  const navigation = useNavigation<VideoTestScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<string | null>(null);

  // 测试数据
  const testData = {
    imageToVideo: {
      firstFrame: 'https://cdn.wanx.aliyuncs.com/wanx/4210775650342821193/image_to_image/31e318e2f0c34854ba2f8cfc335ddecd_0_with_two_logo.png',
      audio: 'https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/ozwpvi/rap.mp3',
      prompt: '一幅都市奇幻艺术的场景。一个充满动感的涂鸦艺术角色。一个由喷漆所画成的少年，正从一面混凝土墙上活过来。他一边用极快的语速演唱一首英文rap，一边摆着一个经典的、充满活力的说唱歌手姿势。场景设定在夜晚一个充满都市感的铁路桥下。灯光来自一盏孤零零的街灯，营造出电影般的氛围，充满高能量和惊人的细节。视频的音频部分完全由他的rap构成，没有其他对话或杂音。',
      model: 'wan2.5-i2v-preview',
    },
    videoEffect: {
      // 注意：视频特效使用首帧图片，用户提供的截图URL需要替换
      firstFrame: 'https://cdn.wanx.aliyuncs.com/wanx/4210775650342821193/image_to_image/31e318e2f0c34854ba2f8cfc335ddecd_0_with_two_logo.png', // TODO: 替换为用户提供的首帧图片URL
      template: 'frenchkiss',
      model: 'wanx2.1-i2v-turbo',
    },
  };

  // Mock 任务参数构建函数
  const buildMockTaskParams = (type: 'imageToVideo' | 'videoEffect') => {
    const uid = authService.getCurrentUserId() || 'test_user';
    
    if (type === 'imageToVideo') {
      return {
        taskType: TaskType.IMAGE_TO_VIDEO,
        prompt: testData.imageToVideo.prompt,
        images: [testData.imageToVideo.firstFrame],
        audioUrl: testData.imageToVideo.audio, // 音频URL
        activityId: 'test_image_to_video',
        activityTitle: '测试-图生视频',
        activityDescription: '测试图生视频功能',
        activityImage: testData.imageToVideo.firstFrame,
        uid,
        templateId: 'test_template_1',
        price: 0,
        videoParams: {
          resolution: '720P',
        },
      };
    } else {
      // videoEffect
      return {
        taskType: TaskType.VIDEO_EFFECT,
        prompt: '', // 视频特效不需要提示词
        images: [testData.videoEffect.firstFrame], // 视频特效使用首帧图片
        activityId: 'test_video_effect',
        activityTitle: '测试-视频特效',
        activityDescription: `测试视频特效功能 - template: ${testData.videoEffect.template}`,
        activityImage: testData.videoEffect.firstFrame,
        uid,
        templateId: 'test_template_2',
        price: 0,
        videoParams: {
          template: testData.videoEffect.template, // frenchkiss
          resolution: '720P',
        },
      };
    }
  };

  // 测试图生视频
  const handleTestImageToVideo = async () => {
    try {
      setLoading('imageToVideo');
      
      const taskParams = buildMockTaskParams('imageToVideo');
      
      console.log('🧪 [VideoTest] 测试图生视频，参数:', taskParams);
      
      await dispatch(startAsyncTask(taskParams as any)).unwrap();
      
      Alert.alert(
        '✅ 测试启动成功',
        '图生视频任务已提交\n请查看任务面板查看进度',
        [
          {
            text: '确定',
            onPress: () => {
              setLoading(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [VideoTest] 图生视频测试失败:', error);
      Alert.alert('❌ 测试失败', error.message || '启动任务失败');
      setLoading(null);
    }
  };

  // 测试视频特效
  const handleTestVideoEffect = async () => {
    try {
      setLoading('videoEffect');
      
      const taskParams = buildMockTaskParams('videoEffect');
      
      console.log('🧪 [VideoTest] 测试视频特效，参数:', taskParams);
      
      await dispatch(startAsyncTask(taskParams as any)).unwrap();
      
      Alert.alert(
        '✅ 测试启动成功',
        `视频特效任务已提交 (template: ${testData.videoEffect.template})\n请查看任务面板查看进度`,
        [
          {
            text: '确定',
            onPress: () => {
              setLoading(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [VideoTest] 视频特效测试失败:', error);
      Alert.alert('❌ 测试失败', error.message || '启动任务失败');
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>视频功能测试</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>测试场景</Text>
        
        {/* 图生视频测试 */}
        <View style={styles.testCard}>
          <Text style={styles.testTitle}>1. 图生视频测试</Text>
          <Text style={styles.testDescription}>
            首帧图片：{'\n'}
            {testData.imageToVideo.firstFrame.substring(0, 60)}...
          </Text>
          <Text style={styles.testDescription}>
            音频URL：{'\n'}
            {testData.imageToVideo.audio.substring(0, 60)}...
          </Text>
          <Text style={styles.testDescription}>
            注意：有音频时将使用wan2.5-i2v-preview模型
          </Text>
          <Text style={styles.testDescription}>
            提示词：{'\n'}
            {testData.imageToVideo.prompt.substring(0, 100)}...
          </Text>
          <Text style={styles.testDescription}>
            模型：{testData.imageToVideo.model}
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, loading === 'imageToVideo' && styles.testButtonDisabled]}
            onPress={handleTestImageToVideo}
            disabled={!!loading}
          >
            {loading === 'imageToVideo' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>开始测试图生视频</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 视频特效测试 */}
        <View style={styles.testCard}>
          <Text style={styles.testTitle}>2. 视频特效测试</Text>
          <Text style={styles.testDescription}>
            首帧图片：{'\n'}
            {testData.videoEffect.firstFrame.substring(0, 60)}...
          </Text>
          <Text style={styles.testDescription}>
            Template参数：{testData.videoEffect.template}
          </Text>
          <Text style={styles.testDescription}>
            提示词：无（视频特效不需要提示词）
          </Text>
          <Text style={styles.testDescription}>
            模型：{testData.videoEffect.model}
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, loading === 'videoEffect' && styles.testButtonDisabled]}
            onPress={handleTestVideoEffect}
            disabled={!!loading}
          >
            {loading === 'videoEffect' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>开始测试视频特效</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 说明 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📝 说明</Text>
          <Text style={styles.infoText}>
            • 此页面用于测试图生视频和视频特效功能{'\n'}
            • 使用本地mock数据，会调用真实云函数API{'\n'}
            • 测试任务会出现在任务面板中{'\n'}
            • 可以通过任务面板查看任务状态{'\n'}
            • 注意：视频特效的首帧图片URL需要在代码中替换为用户提供的截图URL
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#131313',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  testCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B9D',
    marginBottom: 12,
  },
  testDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 20,
  },
});

export default VideoTestScreen;
