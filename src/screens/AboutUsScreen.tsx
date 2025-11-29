import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BackButton from '../components/BackButton';
import { useUpdate } from 'react-native-update';

type AboutUsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

import { appVersion, jsVersion } from '../config/version';

const AboutUsScreen: React.FC = () => {
  const navigation = useNavigation<AboutUsScreenNavigationProp>();
  const { checkUpdate, downloadUpdate, switchVersion, updateInfo, currentHash } = useUpdate();
  const [checking, setChecking] = useState(false);
  
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCheckUpdate = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const info = await checkUpdate();
      console.log('Update info:', info);
      
      if (info?.update) {
        Alert.alert(
          '发现新版本',
          `版本: ${info.name}\n描述: ${info.description}`,
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '立即更新', 
              onPress: async () => {
                try {
                  // 注意：Pushy 的 downloadUpdate 没有返回具体的进度对象给 await
                  // 这里简化处理，直接下载后重启
                  Alert.alert('正在下载', '请稍候...');
                  const hash = await downloadUpdate();
                  if (hash) {
                    Alert.alert('下载完成', '即将重启应用以生效', [
                      { text: '确定', onPress: () => switchVersion() }
                    ]);
                  }
                } catch (err) {
                  Alert.alert('更新失败', String(err));
                }
              }
            }
          ]
        );
      } else if (info.upToDate) {
        Alert.alert('提示', '当前已是最新版本');
      } else {
        Alert.alert('提示', `检查结果: ${JSON.stringify(info)}`);
      }
    } catch (err) {
      Alert.alert('检查更新出错', String(err));
    } finally {
      setChecking(false);
    }
  };

  const handleOpenPrivacyPolicy = () => {
    navigation.navigate('WebView', {
      url: 'https://xuhanpeace.github.io/facegolow-support/privacy-policy.html',
      title: '隐私政策',
    });
  };

  const handleOpenTermsOfUse = () => {
    navigation.navigate('WebView', {
      url: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
      title: '服务条款',
    });
  };

  const handleOpenUserAgreement = () => {
    navigation.navigate('WebView', {
      url: 'https://xuhanpeace.github.io/facegolow-support/user-agreement.html',
      title: '用户协议',
    });
  };

  const handleOpenSubscriptionAgreement = () => {
    navigation.navigate('WebView', {
      url: 'https://xuhanpeace.github.io/facegolow-support/subscription-agreement.html',
      title: '订阅协议',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <BackButton iconType="close" onPress={handleBackPress} absolute={false} />
        <Text style={styles.headerTitle}>关于我们123456</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/brand-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* 版本号 */}
        <Text style={styles.versionText}>
          App v{appVersion} (Bundle v{jsVersion}){'\n'}
          Hash: {currentHash ? currentHash.substring(0, 8) : 'Default'}
        </Text>

        {/* 手动检查更新按钮 */}
        <TouchableOpacity 
          style={styles.checkButton} 
          onPress={handleCheckUpdate}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.checkButtonText}>检查更新</Text>
          )}
        </TouchableOpacity>

        {/* Pushy 热更新测试文案 */}
        <View style={styles.serviceSection}>
          <Text style={styles.testLabel}>🔥 Pushy 热更新测试 - V6</Text>
          <Text style={styles.testDesc}>
            这是第六次热更新测试（完整流程验证）。
            如果你看到这段文字，说明从 IPA 内置的 1.0.11 成功热更新到了新版本！
            热更新功能完全正常！🎉🎉🎉
          </Text>
        </View>

        {/* App 服务描述 */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceText}>
            美颜换换（FaceGlow） 是一款专业的 AI 照片处理应用，致力于为用户提供智能化的照片美化、个性化相册创作、作品分享与管理等全方位服务。我们通过先进的 AI 技术，帮助用户轻松创作出精美的照片作品，记录生活中的美好瞬间。
          </Text>
        </View>
      </ScrollView>

      {/* 底部版权信息 - 固定在底部 */}
      <View style={styles.footer}>
        <Text style={styles.copyrightText}>© 2025 FaceGlow 版权所有</Text>
        <Text style={styles.recordText}>备案号：待备案</Text>
        
        {/* 法律链接 */}
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.legalLinkText}>隐私政策</Text>
          </TouchableOpacity>
          <Text style={styles.legalLinkDivider}>•</Text>
          <TouchableOpacity onPress={handleOpenTermsOfUse}>
            <Text style={styles.legalLinkText}>服务条款</Text>
          </TouchableOpacity>
          <Text style={styles.legalLinkDivider}>•</Text>
          <TouchableOpacity onPress={handleOpenUserAgreement}>
            <Text style={styles.legalLinkText}>用户协议</Text>
          </TouchableOpacity>
          <Text style={styles.legalLinkDivider}>•</Text>
          <TouchableOpacity onPress={handleOpenSubscriptionAgreement}>
            <Text style={styles.legalLinkText}>订阅协议</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  checkButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceSection: {
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  serviceText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  testLabel: {
    color: '#FFB347',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  testDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: '#131313',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  copyrightText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginBottom: 8,
  },
  recordText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginBottom: 24,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  legalLinkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalLinkDivider: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
});

export default AboutUsScreen;
