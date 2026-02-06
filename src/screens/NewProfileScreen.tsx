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
  Dimensions,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { clearAllSelfies } from '../store/slices/selfieSlice';
import { resetUser } from '../store/slices/userSlice';
import { fetchUserWorks, removeWork, resetUserWorks } from '../store/slices/userWorksSlice'; // Added
import { logoutUser, fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { useUser, useUserSelfies } from '../hooks/useUser';
import UserAvatar from '../components/UserAvatar';
import { userWorkService } from '../services/database/userWorkService';
import { UserWorkModel } from '../types/model/user_works';
import { useSession } from '../hooks/useSession';
import { userDataService } from '../services/database/userDataService';
import UserWorkCard from '../components/UserWorkCard';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { updateProfile } from '../store/slices/userSlice';
import { showSuccessToast } from '../utils/toast';
import { EditNameModal, EditNameModalRef } from '../components/EditNameModal';
import AvatarSelectorModal, { AvatarSelectorModalRef } from '../components/AvatarSelectorModal';
import { DeleteIcon } from '../components/DeleteIcon';
import LinearGradient from 'react-native-linear-gradient';
import { CheckInIcon } from '../components/CheckInIcon';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { CheckInModal } from '../components/CheckInModal';

type NewProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'works' | 'account' | 'selfies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 8; // 卡片之间的固定间隔
const CONTAINER_PADDING = 10; // 容器左右padding

const NewProfileScreen: React.FC = () => {
  const navigation = useNavigation<NewProfileScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('works');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setIsUpdatingAvatar] = useState(false);
  const [isEditingSelfies, setIsEditingSelfies] = useState(false);
  const [, setIsDeletingSelfie] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  const editNameModalRef = React.useRef<EditNameModalRef>(null);
  const avatarSelectorModalRef = React.useRef<AvatarSelectorModalRef>(null);
  
  // 使用用户hooks获取数据
  const { userInfo, isLoggedIn, userProfile } = useUser();
  const { logout: logoutSession } = useSession();
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
  const { selfies, hasSelfies } = useUserSelfies();
  
  // 签到状态
  const { showRedDot, shouldShake } = useCheckInStatus();
  
  // 用户作品状态 (Redux)
  const { works: userWorks, status: worksStatus } = useTypedSelector(state => state.userWorks);
  const worksLoading = worksStatus === 'loading';


  // 根据会员类型获取主题色和图标
  const getMembershipTheme = (type: string | null) => {
    if (type === 'yearly') {
      return {
        primary: '#FFD700', // 金色
        textColor: '#fff',
        gradient: ['rgba(255, 215, 0, 0.15)', 'rgba(255, 140, 0, 0.1)'],
        border: 'rgba(255, 215, 0, 0.3)',
        iconBg: 'rgba(255, 215, 0, 0.15)',
        name: '尊贵年度会员',
        icon: 'star' // 年度会员用皇冠
      };
    } else if (type === 'monthly') {
      return {
        primary: '#FFFFFF', // 提亮为纯白/亮银色
        textColor: '#fff',
        gradient: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'], // 更清透的白色渐变
        border: 'rgba(255, 255, 255, 0.3)',
        iconBg: 'rgba(255, 255, 255, 0.15)',
        name: '尊享月度会员',
        icon: 'star' // 月度会员用星星
      };
    } else {
      // 普通用户
      return {
        primary: 'rgba(255, 255, 255, 0.3)', // 暗淡的白色
        textColor: 'rgba(255, 255, 255, 0.3)',
        gradient: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'],
        border: 'rgba(255, 255, 255, 0.15)',
        iconBg: 'rgba(255, 255, 255, 0.08)',
        name: '普通会员',
        icon: 'user' // 普通用户用用户图标
      };
    }
  };

  const memberTheme = getMembershipTheme(membershipStatus?.type || null);

  useEffect(() => {
    console.log('🔍 [NewProfileScreen] userProfile:', userProfile);
    loadUserWorks();

  }, []);

  // 处理头像选择
  const handleAvatarSelect = async (selfieUrl: string | null) => {
    if (!userProfile?.uid) {
      Alert.alert('错误', '无法获取用户信息');
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      const updateData: any = {
        uid: userProfile.uid,
        picture: selfieUrl || '',
        selfie_url: selfieUrl || '',
      };

      const result = await userDataService.updateUserData(updateData);
      
      if (result.success) {
        dispatch(updateProfile({
          picture: selfieUrl || '',
          selfie_url: selfieUrl || '',
        }));
        
        await dispatch(fetchUserProfile());
        
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
    const currentName = userInfo.name || userInfo.username || '';
    editNameModalRef.current?.show(currentName);
  };


  const handleAddSelfiePress = () => {
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    // 判断是否为新用户（没有自拍）
    const isNewUser = !hasSelfies || selfies.length === 0;
    // 跳转到自拍引导页
    navigation.navigate('SelfieGuide', { isNewUser });
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    // 切换到"我的作品"时，如果已有缓存数据，不重新加载
    if (tab === 'works' && userWorks.length === 0) {
      loadUserWorks();
    }
  };
  
  const handleManageMembership = () => {
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    navigation.navigate('Subscription');
  };

  const handleDeleteSelfie = async (selfieUrl: string) => {
    if (!userProfile?.uid) {
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
              const currentSelfieList = userProfile.selfie_list || [];
              const updatedSelfieList = currentSelfieList.filter(url => url !== selfieUrl);

              const updateData: any = {
                uid: userProfile.uid,
                selfie_list: updatedSelfieList,
              };

              if (userProfile.selfie_url === selfieUrl) {
                updateData.selfie_url = '';
                updateData.picture = '';
              }

              const result = await userDataService.updateUserData(updateData);
              
              if (result.success) {
                dispatch(updateProfile(updateData));
                await dispatch(fetchUserProfile());
                showSuccessToast('删除成功');
                
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

  // 退出登录（带二次确认）
  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？退出后需要重新登录才能使用完整功能。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定退出',
          style: 'destructive',
          onPress: async () => {
            try {
              // 清除 Redux 状态
              dispatch(resetUser());
              dispatch(clearAllSelfies());
              dispatch(logoutUser());
              
              // 执行登出
              await logoutSession();
              
              // 清除作品列表
              // setUserWorks([]);
              
              showSuccessToast('已退出登录');
              
              // 返回首页
              setTimeout(() => {
                navigation.popToTop();
              }, 500);
            } catch (error: any) {
              console.error('退出登录失败:', error);
              Alert.alert('退出失败', error.message || '退出登录时发生错误');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!userProfile?.uid) {
      Alert.alert('错误', '无法获取用户信息');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await userDataService.deleteAccount(userProfile.uid);
      if (result.success) {
        dispatch(resetUser()); 
        dispatch(clearAllSelfies()); 
        dispatch(logoutUser()); 
        
        await logoutSession();

        // setUserWorks([]); 
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
    navigation.navigate('UserWorkPreview', { 
      work,
      initialWorkId: work._id,
      worksList: userWorks
    });
  };

  const handleWorkDelete = async (work: UserWorkModel) => {
    if (!work._id) return;
    
    try {
      const result = await userWorkService.deleteWork(work._id);
      if (result.success) {
        // 立即从 Redux store 中移除作品，更新 UI
        dispatch(removeWork(work._id));
        showSuccessToast('删除成功'); 
        // 然后重新获取数据以确保与服务器同步
        loadUserWorks();
      } else {
        Alert.alert('删除失败', result.error?.message || '请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('删除失败', error.message || '发生未知错误');
    }
  };

  // 获取用户作品 (Redux)
  const loadUserWorks = () => {
    if (!isLoggedIn) {
      // 退出登录后：清空作品列表且不再触发请求
      dispatch(resetUserWorks());
      return;
    }
    console.log('🔄 开始获取用户作品(Redux)...');
    dispatch(fetchUserWorks());
  };

  // Focus Effect: 从其他页面返回时刷新用户数据（特别是从购买页/订阅页返回）
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchUserProfile());
      // 刷新作品列表，确保异步任务状态更新（uid 在底层自动获取）
      loadUserWorks();
    }, [dispatch])
  );

  // 动态计算卡片宽度：使用 2 列
  const columns = 2;
  const cardWidth = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - CARD_GAP * (columns - 1)) / columns;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部导航 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.placeholder}>
            {/* 签到入口 - 仅登录用户显示 */}
            {isLoggedIn && (
              <CheckInIcon
                onPress={() => setShowCheckInModal(true)}
                showRedDot={showRedDot}
                shouldShake={shouldShake}
                size={24}
                iconColor="#fff"
              />
            )}
          </View>
          <Text style={styles.headerTitle}>简介</Text>
          <View style={styles.placeholder} />
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
              size={64} 
              onPress={() => {
                avatarSelectorModalRef.current?.show();
              }}
              clickable={hasSelfies || !!userInfo.avatar}
            />
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{userInfo.name || userInfo.username || '未设置用户名'}</Text>
              {isLoggedIn && (
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePress}>
                  <FontAwesome name="pencil" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* 会员徽章 - 仅登录用户显示 */}
            {isLoggedIn && (
              <TouchableOpacity 
                style={[styles.badgeContainer, { borderColor: memberTheme.primary }]}
                onPress={() => {
                  if (!membershipStatus) {
                    // 普通用户点击跳转会员购买
                    navigation.navigate('Subscription');
                  }
                }}
                activeOpacity={!membershipStatus ? 0.7 : 1}
              >
                <FontAwesome 
                  name={memberTheme.icon} 
                  size={10} 
                  color={memberTheme.primary} 
                  style={{marginRight: 4}} 
                />
                <Text style={[styles.badgeText, { color: memberTheme.textColor }]}>
                  {memberTheme.name}
                </Text>
              </TouchableOpacity>
            )}
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
                <TouchableOpacity 
                  style={[styles.premiumCardContainer, { borderColor: memberTheme.border }]}
                  onPress={handleManageMembership}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={memberTheme.gradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.premiumCard}
                  >
                    <View style={styles.premiumCardHeader}>
                      <View style={styles.premiumTitleRow}>
                        <View style={[styles.premiumIconBg, { backgroundColor: memberTheme.iconBg }]}>
                          <FontAwesome name={memberTheme.icon} size={16} color={memberTheme.primary} />
                        </View>
                        <Text style={[styles.premiumTitleText, { color: memberTheme.primary }]}>
                          {memberTheme.name}
                        </Text>
                      </View>
                      <View style={[styles.premiumStatusBadge, { backgroundColor: memberTheme.primary }]}>
                        <Text style={styles.premiumStatusText}>生效中</Text>
                      </View>
                    </View>
                    
                    <View style={styles.premiumDivider} />
                    
                    <View style={styles.premiumInfoRow}>
                      <View style={{flex: 1}}>
                        <Text style={styles.premiumLabel}>到期时间</Text>
                        <Text style={styles.premiumValue}>
                          {membershipStatus.expiresAt ? new Date(membershipStatus.expiresAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : '永久'}
                        </Text>
                      </View>
                      <View style={styles.premiumAction}>
                        <Text style={[styles.premiumActionText, { color: memberTheme.primary }]}>{isAutoRenew ? '管理' : '续订'}</Text>
                        <FontAwesome name="angle-right" size={16} color={memberTheme.primary} />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.normalCard}
                  onPress={handleManageMembership}
                  activeOpacity={0.9}
                >
                  <View style={styles.normalCardContent}>
                    <View>
                      <Text style={styles.normalTitle}>普通会员</Text>
                      <Text style={styles.normalSubtitle}>升级解锁全部高级功能</Text>
                    </View>
                    <View style={styles.upgradeButtonSmall}>
                      <Text style={styles.upgradeButtonText}>立即升级</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              
              {/* 美美币余额卡片 */}
              <TouchableOpacity
                style={styles.balanceCard}
                onPress={() => {
                  if (!isLoggedIn) {
                    navigation.navigate('NewAuth');
                    return;
                  }
                  navigation.navigate('CoinPurchase');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.balanceContent}>
                  <View style={styles.balanceLeft}>
                    <Image 
                      source={require('../assets/mm-coins.png')} 
                      style={styles.coinIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.balanceTitle}>美美币余额</Text>
                  </View>
                  <View style={styles.balanceRight}>
                    <Text style={styles.balanceAmount}>{userInfo.balance}</Text>
                    <FontAwesome name="angle-right" size={16} color="rgba(255, 255, 255, 0.3)" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* 账户操作 - 仅登录用户显示 */}
              {isLoggedIn && (
                <View style={styles.accountActions}>
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>退出登录</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteAccountButton}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <Text style={styles.deleteAccountText}>删除账户</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                        onDelete={handleWorkDelete}
                        cardWidth={cardWidth}
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
                          ]}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                        {/* 编辑模式下显示删除按钮 */}
                        {isEditingSelfies && (
                          <View style={styles.deleteSelfieButton}>
                            <DeleteIcon 
                              onPress={() => handleDeleteSelfie(selfie.url)} 
                              size={24}
                            />
                          </View>
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
          <View style={styles.aboutUsDivider} />
          <TouchableOpacity 
            style={styles.aboutUsButton}
            onPress={() => navigation.navigate('AboutUs')}
          >
            <Text style={styles.aboutUsText}>关于我们</Text>
          </TouchableOpacity>
          
          {/* 测试入口 */}
          {/* <TouchableOpacity 
            style={styles.aboutUsButton}
            onPress={() => navigation.navigate('VideoTest')}
          >
            <Text style={[styles.aboutUsText, { color: '#FF6B9D' }]}>🧪 视频功能测试</Text>
          </TouchableOpacity> */}
        </View>

      </ScrollView>

      {/* ... (Modals 保持不变) ... */}
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

      {/* 页面级 Modal */}
      <EditNameModal ref={editNameModalRef} />
      <AvatarSelectorModal ref={avatarSelectorModalRef} onSelect={handleAvatarSelect} />

      {/* 签到Modal - 仅登录用户显示 */}
      {isLoggedIn && (
        <CheckInModal
          visible={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (前面的样式保持不变)
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    width: 32, // 与 BackButton 宽度一致，确保标题居中
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  editButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    // borderColor: '#FFD700', // 移除这里，改为动态样式
    marginTop: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 10
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
    columnGap: CARD_GAP,
    rowGap: 16,
  },
  selfiesContainer: {
    flex: 1,
  },
  selfiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  selfieItem: {
    alignItems: 'center',
    width: '30%',
    position: 'relative',
  },
  deleteSelfieButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
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
    paddingVertical: 10,
  },
  premiumCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, // 确保保留边框宽度，颜色动态设置
  },
  premiumCard: {
    // width: '100%',
  },
  premiumCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 15,
    paddingBottom: 0,
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  premiumTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumStatusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  premiumInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 0,
  },
  premiumLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginBottom: 4,
  },
  premiumValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  premiumAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumActionText: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: '600',
  },
  normalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
  },
  normalCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  normalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  normalSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  upgradeButtonSmall: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  balanceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  balanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  accountActions: {
    marginTop: 30,
    paddingTop: 0,
    borderTopWidth: 0,
    alignItems: 'center',
    gap: 16,
  },
  logoutButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  deleteAccountButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteAccountText: {
    color: 'rgba(255, 255, 255, 0.3)',
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
  aboutUsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    paddingBottom: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  aboutUsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
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
