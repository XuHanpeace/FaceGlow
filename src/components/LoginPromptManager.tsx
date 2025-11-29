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

  useEffect(() => {
    // 设置显示回调
    loginPromptService.setShowCallback(() => {
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
    // 导航到登录/注册页面（已合并，系统会自动识别）
    navigate('NewAuth', {});
  };

  return (
    <LoginPromptModal
      visible={visible}
      onClose={handleClose}
      onLogin={handleLogin}
    />
  );
};

export default LoginPromptManager;

