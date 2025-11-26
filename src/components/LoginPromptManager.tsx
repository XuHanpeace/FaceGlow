import React, { useState, useEffect } from 'react';
import { loginPromptService } from '../services/loginPromptService';
import LoginPromptModal from './LoginPromptModal';
import { navigate } from '../navigation/navigationUtils';

/**
 * 登录提示管理器组件
 * 全局管理登录提示弹窗的显示
 */
const LoginPromptManager: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showReason, setShowReason] = useState<'anonymous' | 'authLost'>('anonymous');

  useEffect(() => {
    // 设置显示回调
    loginPromptService.setShowCallback((reason) => {
      setShowReason(reason);
      setVisible(true);
    });

    // 设置关闭回调
    loginPromptService.setDismissCallback(() => {
      setVisible(false);
    });

    return () => {
      loginPromptService.setShowCallback(() => {});
      loginPromptService.setDismissCallback(() => {});
    };
  }, []);

  const handleClose = () => {
    loginPromptService.recordDismiss();
    setVisible(false);
  };

  const handleLogin = () => {
    setVisible(false);
    // 导航到登录页面（手机号登录模式）
    navigate('NewAuth');
  };

  const handleRegister = () => {
    setVisible(false);
    // 导航到注册页面，传递 initialMode 参数强制显示注册模式
    navigate('NewAuth', { initialMode: 'register' });
  };

  return (
    <LoginPromptModal
      visible={visible}
      onClose={handleClose}
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  );
};

export default LoginPromptManager;

