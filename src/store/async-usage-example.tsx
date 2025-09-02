import React, { useEffect } from 'react';
import { useTypedSelector, useAppDispatch } from './hooks';
import {
  loginUser,
  registerUser,
  sendVerificationCode,
  logoutUser,
  fetchUserProfile,
  updateUserBalance,
  uploadSelfie,
  fetchUserSelfies,
  deleteSelfie,
  fetchTemplates,
  likeTemplate,
} from './middleware/asyncMiddleware';

// 使用示例：如何在组件中使用createAsyncThunk异步操作
const AsyncUsageExample: React.FC = () => {
  const dispatch = useAppDispatch();

  // 获取状态
  const authState = useTypedSelector((state) => state.auth);
  const userState = useTypedSelector((state) => state.user);
  const selfieState = useTypedSelector((state) => state.selfies);
  const templateState = useTypedSelector((state) => state.templates);

  // 1. 用户认证相关操作
  const handleLogin = async () => {
    try {
      const result = await dispatch(loginUser({
        username: 'testuser',
        password: 'password123'
      })).unwrap();
      
      console.log('登录成功:', result);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleRegister = async () => {
    try {
      // 先发送验证码
      const verificationResult = await dispatch(sendVerificationCode({
        phoneNumber: '15773209147'
      })).unwrap();
      
      // 然后注册
      const result = await dispatch(registerUser({
        phoneNumber: '15773209147',
        username: 'newuser',
        verificationCode: '123456',
        verificationId: verificationResult.verificationId,
        password: 'password123'
      })).unwrap();
      
      console.log('注册成功:', result);
    } catch (error) {
      console.error('注册失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      console.log('登出成功');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 2. 用户信息相关操作
  const handleFetchUserProfile = async () => {
    try {
      const result = await dispatch(fetchUserProfile({
        userId: 'user-1'
      })).unwrap();
      
      console.log('获取用户信息成功:', result);
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const handleUpdateBalance = async () => {
    try {
      const result = await dispatch(updateUserBalance({
        amount: 100
      })).unwrap();
      
      console.log('更新余额成功:', result);
    } catch (error) {
      console.error('更新余额失败:', error);
    }
  };

  // 3. 自拍照相关操作
  const handleUploadSelfie = async () => {
    try {
      const result = await dispatch(uploadSelfie({
        imageData: {
          uri: 'https://example.com/selfie.jpg',
          type: 'image/jpeg',
          name: 'selfie.jpg'
        }
      })).unwrap();
      
      console.log('上传自拍照成功:', result);
    } catch (error) {
      console.error('上传自拍照失败:', error);
    }
  };

  const handleFetchSelfies = async () => {
    try {
      const result = await dispatch(fetchUserSelfies({
        userId: 'user-1'
      })).unwrap();
      
      console.log('获取自拍照列表成功:', result);
    } catch (error) {
      console.error('获取自拍照列表失败:', error);
    }
  };

  const handleDeleteSelfie = async (selfieId: string) => {
    try {
      const result = await dispatch(deleteSelfie({
        selfieId
      })).unwrap();
      
      console.log('删除自拍照成功:', result);
    } catch (error) {
      console.error('删除自拍照失败:', error);
    }
  };

  // 4. 模板相关操作
  const handleFetchTemplates = async (categoryId: string) => {
    try {
      const result = await dispatch(fetchTemplates({
        categoryId
      })).unwrap();
      
      console.log('获取模板列表成功:', result);
    } catch (error) {
      console.error('获取模板列表失败:', error);
    }
  };

  const handleLikeTemplate = async (templateId: string) => {
    try {
      const result = await dispatch(likeTemplate({
        templateId
      })).unwrap();
      
      console.log('点赞模板成功:', result);
    } catch (error) {
      console.error('点赞模板失败:', error);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    // 获取用户信息
    if (authState.isAuthenticated) {
      handleFetchUserProfile();
      handleFetchSelfies();
    }
    
    // 获取模板数据
    handleFetchTemplates('art-branding');
    handleFetchTemplates('community');
  }, [authState.isAuthenticated]);

  return (
    <div>
      <h2>Redux Async Thunk 使用示例</h2>
      
      {/* 认证状态 */}
      <div>
        <h3>认证状态</h3>
        <p>登录状态: {authState.isAuthenticated ? '已登录' : '未登录'}</p>
        <p>加载状态: {authState.loading ? '加载中...' : '空闲'}</p>
        {authState.error && <p style={{color: 'red'}}>错误: {authState.error}</p>}
        
        <button onClick={handleLogin}>登录</button>
        <button onClick={handleRegister}>注册</button>
        <button onClick={handleLogout}>登出</button>
      </div>

      {/* 用户信息 */}
      <div>
        <h3>用户信息</h3>
        <p>用户名: {userState.profile?.username || '未设置'}</p>
        <p>余额: {userState.profile?.balance || 0}</p>
        <p>会员状态: {userState.profile?.isPremium ? '会员' : '普通用户'}</p>
        
        <button onClick={handleFetchUserProfile}>获取用户信息</button>
        <button onClick={handleUpdateBalance}>更新余额</button>
      </div>

      {/* 自拍照 */}
      <div>
        <h3>自拍照</h3>
        <p>自拍照数量: {selfieState.selfies.length}</p>
        <p>上传状态: {selfieState.uploading ? '上传中...' : '空闲'}</p>
        {selfieState.uploadProgress > 0 && (
          <p>上传进度: {selfieState.uploadProgress}%</p>
        )}
        
        <button onClick={handleUploadSelfie}>上传自拍照</button>
        <button onClick={handleFetchSelfies}>获取自拍照列表</button>
        {selfieState.selfies.length > 0 && (
          <button onClick={() => handleDeleteSelfie(selfieState.selfies[0].id)}>
            删除第一张自拍照
          </button>
        )}
      </div>

      {/* 模板 */}
      <div>
        <h3>模板</h3>
        <p>Art Branding 模板数量: {templateState.templates['art-branding']?.length || 0}</p>
        <p>Community 模板数量: {templateState.templates['community']?.length || 0}</p>
        
        <button onClick={() => handleFetchTemplates('art-branding')}>
          获取 Art Branding 模板
        </button>
        <button onClick={() => handleFetchTemplates('community')}>
          获取 Community 模板
        </button>
        {templateState.templates['art-branding']?.length > 0 && (
          <button onClick={() => handleLikeTemplate(templateState.templates['art-branding'][0].id)}>
            点赞第一个模板
          </button>
        )}
      </div>
    </div>
  );
};

export default AsyncUsageExample;
