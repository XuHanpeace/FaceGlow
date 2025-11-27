import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile } from '../store/slices/userSlice';
import { userDataService } from '../services/database/userDataService';
import { showSuccessToast } from '../utils/toast';
import GradientButton from './GradientButton';

export interface EditNameModalRef {
  show: (initialName?: string) => void;
  hide: () => void;
}

interface EditNameModalProps {
  onSuccess?: () => void;
}

/**
 * 编辑昵称 Modal
 * 使用 ref 控制显示/隐藏
 */
export const EditNameModal = forwardRef<EditNameModalRef, EditNameModalProps>(({ onSuccess }, ref) => {
  const user = useAppSelector((state) => state.user.profile);
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  useImperativeHandle(ref, () => ({
    show: (initialName?: string) => {
      if (initialName !== undefined) {
        setEditNameValue(initialName);
      }
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
    }
  }));

  const onClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  const handleSaveName = async () => {
    const trimmedName = editNameValue.trim();
    
    if (!trimmedName) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }
    
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
        showSuccessToast('昵称更新成功');
        onClose();
        onSuccess?.();
      } else {
        Alert.alert('更新失败', result.error?.message || '更新昵称失败，请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('更新失败', error.message || '更新昵称时发生错误');
    } finally {
      setIsUpdatingName(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={() => !isUpdatingName && onClose()}
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
                  onPress={onClose}
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
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  nameInputHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  gradientButton: {
    flex: 1,
  },
});

