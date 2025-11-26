import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { clearAllSelfies } from '../store/slices/selfieSlice';
import { resetUser } from '../store/slices/userSlice';
import { logoutUser } from '../store/middleware/asyncMiddleware';
import { useUser, useUserSelfies } from '../hooks/useUser';
import UserAvatar from '../components/UserAvatar';
import { userWorkService } from '../services/database/userWorkService';
import { UserWorkModel } from '../types/model/user_works';
import { useAuthState } from '../hooks/useAuthState';
import { userDataService } from '../services/database/userDataService';
import UserWorkCard from '../components/UserWorkCard';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { updateProfile } from '../store/slices/userSlice';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';
import { showSuccessToast } from '../utils/toast';
import AvatarSelectorModal from '../components/AvatarSelectorModal';
import { authService } from '../services/auth/authService';

type NewProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'works' | 'account' | 'selfies';

interface SelfieItem {
  id: string;
  imageUrl: string;
  createdAt: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12; // 卡片之间的固定间隔
const CONTAINER_PADDING = 20; // 容器左右padding
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - CARD_GAP) / 2; // 计算卡片宽度

const NewProfileScreen: React.FC = () => {
  const navigation = useNavigation<NewProfileScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>('works');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isEditingSelfies, setIsEditingSelfies] = useState(false);
  const [isDeletingSelfie, setIsDeletingSelfie] = useState(false);
  
  // 使用用户hooks获取数据
  const { userInfo, isLoggedIn, userProfile, refreshUserData } = useUser();
  const isAutoRenew = userInfo.subscriptionAutoRenew;
  
  // 获取当前会员状态
  const getCurrentMembershipStatus = () => {
    if (!userProfile) return null;
    
    const isPremium = userProfile.is_premium || false;
    const premiumExpiresAt = userProfile.premium_expires_at;
    const subscriptionType = userProfile.subscription_type;
    
    if (isPremium && premiumExpiresAt) {
      const now = Date.now();
      if (now < premiumExpiresAt) {
        return {
          isActive: true,
          type: subscriptionType,
          expiresAt: premiumExpiresAt,
        };
      }
    }
    return null;
  };
  
  const membershipStatus = getCurrentMembershipStatus();
  const { selfies, hasSelfies, defaultSelfieUrl } = useUserSelfies();
  
  // 用户作品状态
  const [userWorks, setUserWorks] = useState<UserWorkModel[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const { user, logout } = useAuthState();

  // 从Redux获取其他数据
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleGiftPress = () => {
    // 处理礼物功能
    console.log('Gift pressed');
    navigation.navigate('TestCenter')
  };
               
  const handleSharePress = () => {
    // 处理分享功能
    console.log('Share pressed');
    navigation.navigate('TestCenter')
  };

  const handleContactsPress = () => {
    // 处理查看联系人创作
    console.log('Contacts pressed');
  };

  // 处理头像选择
  const handleAvatarSelect = async (selfieUrl: string | null) => {
    if (!user?.uid) {
      Alert.alert('错误', '无法获取用户信息');
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      // 更新用户数据：
      // 1. picture 字段用于显示头像（UserAvatar 组件使用）
      // 2. selfie_url 字段用于标记当前使用的自拍
      // 如果选择默认头像，将两个字段都置为空字符串
      const updateData: any = {
        uid: user.uid,
        picture: selfieUrl || '',
        selfie_url: selfieUrl || '',
      };

      const result = await userDataService.updateUserData(updateData);
      
      if (result.success) {
        // 更新 Redux 中的用户数据
        dispatch(updateProfile({
          picture: selfieUrl || '',
          selfie_url: selfieUrl || '',
        }));
        
        // 刷新用户数据（确保从服务器获取最新数据）
        await refreshUserData();
        
        showSuccessToast(selfieUrl ? '头像更新成功' : '已切换为默认头像');
      } else {
        Alert.alert('更新失败', result.error?.message || '头像更新失败，请重试');
      }
    } catch (error: any) {
      console.error('更新头像失败:', error);
      Alert.alert('更新失败', error.message || '头像更新失败，请重试');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleEditProfilePress = () => {
    // 打开编辑昵称弹窗
    const currentName = userInfo.name || userInfo.username || '';
    setEditNameValue(currentName);
    setShowEditNameModal(true);
  };

  const handleSaveName = async () => {
    // 验证昵称
    const trimmedName = editNameValue.trim();
    
    // 检查是否为空
    if (!trimmedName) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }
    
    // 检查是否只包含空格
    if (trimmedName.length === 0) {
      Alert.alert('提示', '昵称不能只包含空格');
      return;
    }
    
    // 检查长度（假设最大长度为20）
    if (trimmedName.length > 20) {
      Alert.alert('提示', '昵称长度不能超过20个字符');
      return;
    }
    
    if (!user?.uid) {
      Alert.alert('错误', '无法获取用户信息');
      return;
    }
    
    setIsUpdatingName(true);
    try {
      const result = await userDataService.updateUserData({
        uid: user.uid,
        name: trimmedName,
      });
      
      if (result.success) {
        // 更新 Redux
        dispatch(updateProfile({ name: trimmedName }));
        setShowEditNameModal(false);
        showSuccessToast('昵称更新成功');
      } else {
        Alert.alert('更新失败', result.error?.message || '更新昵称失败，请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('更新失败', error.message || '更新昵称时发生错误');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleAddSelfiePress = () => {
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    // 跳转到自拍引导页
    navigation.navigate('SelfieGuide');
  };

  const handleAddMockSelfie = () => {

  };

  const handleAddPostPress = () => {
    // 处理添加帖子
    console.log('Add post pressed');
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    // 切换到"我的作品"时，如果已有缓存数据，不重新加载
    if (tab === 'works' && userWorks.length === 0) {
      fetchUserWorks();
    }
  };
  
  const handleManageMembership = () => {
    navigation.navigate('Subscription');
  };

  const handleDeleteSelfie = async (selfieUrl: string) => {
    if (!user?.uid || !userProfile) {
      Alert.alert('错误', '无法获取用户信息');
      return;
    }

    Alert.alert(
      '确认删除',
      '确定要删除这张自拍吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingSelfie(true);
            try {
              // 从 selfie_list 中移除选中的自拍
              const currentSelfieList = userProfile.selfie_list || [];
              const updatedSelfieList = currentSelfieList.filter(url => url !== selfieUrl);

              // 如果删除的是当前头像，需要清空 selfie_url
              const updateData: any = {
                uid: user.uid,
                selfie_list: updatedSelfieList,
              };

              // 如果删除的是当前使用的头像，清空 selfie_url 和 picture
              if (userProfile.selfie_url === selfieUrl) {
                updateData.selfie_url = '';
                updateData.picture = '';
              }

              const result = await userDataService.updateUserData(updateData);
              
              if (result.success) {
                // 更新 Redux 中的用户数据
                dispatch(updateProfile(updateData));
                
                // 刷新用户数据
                await refreshUserData();
                
                showSuccessToast('删除成功');
                
                // 如果删除后没有自拍了，退出编辑模式
                if (updatedSelfieList.length === 0) {
                  setIsEditingSelfies(false);
                }
              } else {
                Alert.alert('删除失败', result.error?.message || '删除自拍失败，请重试');
              }
            } catch (error: any) {
              console.error('删除自拍失败:', error);
              Alert.alert('删除失败', error.message || '删除自拍时发生错误');
            } finally {
              setIsDeletingSelfie(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) {
      Alert.alert('错误', '无法获取用户信息');
      return;
    }

    setIsDeleting(true);
    try {
      // 步骤1: 调用服务器端软删除（设置 accountStatus = 1）
      const result = await userDataService.deleteAccount(user.uid);
      debugger
      if (result.success) {
        // 步骤2: 清除所有用户相关的 Redux 状态
        dispatch(resetUser()); // 重置用户状态为初始值（包括头像和默认自拍）
        dispatch(clearAllSelfies()); // 清除所有自拍数据
        // 注意：活动数据是公共数据，匿名用户也能访问，不需要清除
        dispatch(logoutUser()); // 清除认证状态
        
        // 步骤3: 清除本地存储的认证数据（MMKV）
        await logout();
        
        // 步骤4: 清除本地 state（作品列表等）
        setUserWorks([]); // 清空作品列表
        setShowDeleteConfirm(false);
        
        Alert.alert(
          '账户已删除',
          '您的账户已成功删除。感谢您使用 FaceGlow！',
          [
            {
              text: '确定',
              onPress: () => {
                
              }
            }
          ]
        );
      } else {
        Alert.alert('删除失败', result.error?.message || '删除账户失败，请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('删除失败', error.message || '删除账户时发生错误');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWorkPress = (work: UserWorkModel) => {
    navigation.navigate('UserWorkPreview', { work });
  };

  // 获取用户作品
  const fetchUserWorks = async () => {
    if (!user?.uid) {
      console.log('❌ 用户未登录，无法获取作品');
      return;
    }

    setWorksLoading(true);
    try {
      console.log('🔄 开始获取用户作品...');
      const result = await userWorkService.getUserWorks({ uid: user.uid });
      
      if (result.success && result.data) {
        const works = Array.isArray(result.data.records) ? result.data.records : [];
        console.log('✅ 获取用户作品成功:', works.length, '个作品');
        setUserWorks(works);
      } else {
        console.log('❌ 获取用户作品失败:', result.error?.message);
        setUserWorks([]);
      }
    } catch (error: any) {
      console.error('❌ 获取用户作品异常:', error);
      setUserWorks([]);
    } finally {
      setWorksLoading(false);
    }
  };

  // 组件加载时获取用户作品，或当用户状态变化时清空作品列表
  useEffect(() => {
    if (isLoggedIn && user?.uid && userProfile) {
      fetchUserWorks();
    } else {
      // 用户已登出或用户资料为空，清空作品列表
      setUserWorks([]);
    }
  }, [isLoggedIn, user?.uid, userProfile]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <BackButton iconType="close" onPress={handleBackPress} absolute={false} />
        <Text style={styles.headerTitle}>简介</Text>
        <View style={styles.placeholder} />
        {/* <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleGiftPress}>
            <FontAwesome name="gift" size={20} color="#FF6B9D" />
          </TouchableOpacity>
        </View> */}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <UserAvatar 
              size={48} 
              onLongPress={() => setShowAvatarSelector(true)}
              clickable={hasSelfies || !!userInfo.avatar}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{userInfo.name || userInfo.username || '未设置用户名'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePress}>
              <FontAwesome name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 添加自拍照 */}
        <TouchableOpacity style={styles.instagramButton} onPress={handleAddSelfiePress}>
          <View style={styles.instagramIcon}>
            <FontAwesome name="camera" size={18} color="#fff" />
          </View>
          <Text style={styles.instagramText}>添加自拍照</Text>
          <FontAwesome name="plus" size={20} color="#fff" style={styles.plusIcon} />
        </TouchableOpacity>

        {/* 导航标签 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'works' && styles.activeTab]}
            onPress={() => handleTabPress('works')}
          >
            <Text style={[styles.tabText, activeTab === 'works' && styles.activeTabText]}>
              我的作品
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'selfies' && styles.activeTab]}
            onPress={() => handleTabPress('selfies')}
          >
            <Text style={[styles.tabText, activeTab === 'selfies' && styles.activeTabText]}>
              我的自拍
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'account' && styles.activeTab]}
            onPress={() => handleTabPress('account')}
          >
            <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>
              账户管理
            </Text>
          </TouchableOpacity>
        </View>

        {/* 内容区域 */}
        <View style={styles.contentArea}>
          {activeTab === 'account' && (
            <View style={styles.membershipContainer}>
              {membershipStatus ? (
                <View style={styles.membershipCard}>
                  <View style={styles.membershipHeader}>
                    <FontAwesome 
                      name={membershipStatus.type === 'yearly' ? 'star' : 'star-o'} 
                      size={32} 
                      color={membershipStatus.type === 'yearly' ? '#FFD700' : '#C0C0C0'} 
                    />
                    <Text style={styles.membershipTitle}>
                      {membershipStatus.type === 'yearly' ? '年度会员' : '月度会员'}
                    </Text>
                  </View>
                  <Text style={styles.membershipStatusText}>会员状态：有效</Text>
                  {membershipStatus.expiresAt && (
                    <View style={styles.membershipExpires}>
                      <Text style={styles.membershipExpiresLabel}>到期时间：</Text>
                      <Text style={styles.membershipExpiresDate}>
                        {new Date(membershipStatus.expiresAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.manageLink}
                    onPress={handleManageMembership}
                  >
                    <Text style={styles.manageLinkText}>
                      {isAutoRenew ? '去管理' : '去续订'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.membershipCard}>
                  <FontAwesome name="user-circle" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.membershipTitle}>普通用户</Text>
                  <Text style={styles.membershipStatusText}>您还不是会员</Text>
                  <TouchableOpacity 
                    style={styles.manageLink}
                    onPress={handleManageMembership}
                  >
                    <Text style={styles.manageLinkText}>去订阅</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* 删除账户入口（不显眼） */}
              <View style={styles.accountActions}>
                <TouchableOpacity 
                  style={styles.deleteAccountButton}
                  onPress={() => setShowDeleteConfirm(true)}
                >
                  <Text style={styles.deleteAccountText}>删除账户</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {activeTab === 'works' && (
            <View style={styles.worksContainer}>
              {worksLoading && userWorks.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <FontAwesome name="paint-brush" size={24} color="#999" />
                  <Text style={styles.loadingText}>正在加载作品...</Text>
                </View>
              ) : userWorks.length > 0 ? (
                <View style={styles.worksGrid}>
                  {userWorks.map((work) => (
                    <UserWorkCard
                      key={work._id}
                      work={work}
                      onPress={handleWorkPress}
                      cardWidth={CARD_WIDTH}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <FontAwesome name="paint-brush" size={20} color="#ddd" style={{marginBottom: 10}}/>
                  <Text style={styles.emptyText}>还没有作品哦</Text>
                  <Text style={styles.emptySubText}>快去创作你的第一个作品吧～</Text>
                </View>
              )}
            </View>
          )}
          {activeTab === 'selfies' && (
            <View style={styles.selfiesContainer}>
              <View style={styles.selfiesGrid}>
                {hasSelfies ? (
                  <>
                    {selfies.map((selfie) => (
                      <View key={selfie.id} style={styles.selfieItem}>
                        <FastImage 
                          source={selfie.source} 
                          style={[
                            styles.selfieImage,
                            selfie.url === defaultSelfieUrl && styles.defaultSelfieImage
                          ]}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                        {/* 编辑模式下显示删除按钮 */}
                        {isEditingSelfies && (
                          <TouchableOpacity
                            style={styles.deleteSelfieButton}
                            onPress={() => handleDeleteSelfie(selfie.url)}
                            disabled={isDeletingSelfie}
                          >
                            <FontAwesome name="minus-circle" size={20} color="#FF6B6B" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    {/* 编辑入口 - 作为网格中的最后一项 */}
                    <TouchableOpacity 
                      style={styles.editSelfieItem}
                      onPress={() => {
                        if (isEditingSelfies) {
                          setIsEditingSelfies(false);
                        } else {
                          setIsEditingSelfies(true);
                        }
                      }}
                    >
                      <View style={styles.editSelfiePlaceholder}>
                        <Text style={styles.editSelfieText}>
                          {isEditingSelfies ? '完成' : '编辑'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.emptySelfiesState}>
                    <Text style={styles.emptySelfiesText}>暂无自拍照</Text>
                    <TouchableOpacity style={styles.addFirstSelfieButton} onPress={handleAddSelfiePress}>
                      <Text style={styles.addFirstSelfieText}>添加第一张自拍照</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 关于我们入口 - 跟随内容流 */}
        <View style={styles.aboutUsContainer}>
          <TouchableOpacity 
            style={styles.aboutUsButton}
            onPress={() => navigation.navigate('AboutUs')}
          >
            <Text style={styles.aboutUsText}>关于我们</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* 删除账户确认弹窗 */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.modalTitle}>确定要删除账户吗？</Text>
            <Text style={styles.modalMessage}>
              删除账户后，您的所有数据将被永久删除，包括：
              {'\n'}• 所有作品和自拍照
              {'\n'}• 账户余额和会员权益
              {'\n'}• 所有个人数据
              {'\n\n'}
              此操作无法撤销，请谨慎操作。
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, isDeleting && styles.modalButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {isDeleting ? '删除中...' : '确认删除'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑昵称弹窗 */}
      <Modal
        visible={showEditNameModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => !isUpdatingName && setShowEditNameModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayInner}>
              <View 
                style={styles.modalContent}
                onStartShouldSetResponder={() => true}
              >
                <Text style={styles.modalTitle}>编辑昵称</Text>
                <TextInput
                  style={styles.nameInput}
                  value={editNameValue}
                  onChangeText={setEditNameValue}
                  placeholder="请输入昵称"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  maxLength={20}
                  autoFocus={true}
                  editable={!isUpdatingName}
                />
                <Text style={styles.nameInputHint}>
                  {editNameValue.length}/20
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowEditNameModal(false)}
                    disabled={isUpdatingName}
                  >
                    <Text style={styles.modalButtonCancelText}>取消</Text>
                  </TouchableOpacity>
                  <GradientButton
                    title={isUpdatingName ? '保存中...' : '保存'}
                    onPress={handleSaveName}
                    disabled={isUpdatingName}
                    loading={isUpdatingName}
                    variant="primary"
                    size="medium"
                    style={styles.gradientButton}
                    fontSize={16}
                    borderRadius={8}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* 头像选择弹窗 */}
      <AvatarSelectorModal
        visible={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    width: 10,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  giftIcon: {
    fontSize: 16,
  },
  shareIcon: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  greenBanner: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    marginRight: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  bannerArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  editButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 16,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  instagramIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instagramGradient: {
    fontSize: 18,
  },
  instagramText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  plusIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  activeTabText: {
    opacity: 1,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20
  },
  addPostCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPostIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.6,
  },
  emptySubText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.4,
    marginTop: 8,
  },
  worksContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.6,
  },
  worksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  workItem: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  workImage: {
    width: '100%',
    height: 120,
  },
  workInfo: {
    padding: 12,
  },
  workTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  workDate: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
  },
  selfiesContainer: {
    flex: 1,
  },
  selfiesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  selfiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  selfieItem: {
    alignItems: 'center',
    width: '30%',
    position: 'relative',
  },
  deleteSelfieButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  editSelfieItem: {
    alignItems: 'center',
    width: '30%',
  },
  editSelfiePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  editSelfieText: {
    color: 'rgba(255, 255, 255, 0.1)',
    fontSize: 14,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255, 255, 255, 0.1)',
  },
  selfieImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  defaultSelfieImage: {
    borderWidth: 3,
    borderColor: '#5EE7DF',
  },
  selfieDate: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  testCenterButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  testCenterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptySelfiesState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySelfiesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addFirstSelfieButton: {
    marginTop: 8,
  },
  addFirstSelfieText: {
    fontSize: 14,
    color: '#FF6B9D',
    textDecorationLine: 'underline',
  },
  membershipContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  membershipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  membershipTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  membershipStatusText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 12,
  },
  membershipExpires: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    justifyContent: 'center',
  },
  membershipExpiresLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginRight: 8,
  },
  membershipExpiresDate: {
    color: '#FF6B9D',
    fontSize: 14,
    fontWeight: '600',
  },
  manageLink: {
    marginTop: 16,
  },
  manageLinkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  accountActions: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteAccountButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteAccountText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalOverlayInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 220,
  },
  modalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'left',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF3B30',
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nameInputHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  gradientButton: {
    flex: 1,
    marginLeft: 12,
  },
  aboutUsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  aboutUsButton: {
    paddingVertical: 8,
  },
  aboutUsText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default NewProfileScreen;
