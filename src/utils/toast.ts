import { Toast } from 'toastify-react-native';

/**
 * 显示成功提示
 */
export const showSuccessToast = (message: string, title?: string) => {
  if (title) {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 2000,
    });
  } else {
    Toast.success(message, 'top');
  }
};

/**
 * 显示信息提示（中性消息）
 */
export const showInfoToast = (message: string, title?: string) => {
  if (title) {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 2000,
    });
  } else {
    Toast.info(message, 'top');
  }
};

/**
 * 显示错误提示
 */
export const showErrorToast = (message: string, title?: string) => {
  if (title) {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  } else {
    Toast.error(message, 'top');
  }
};

