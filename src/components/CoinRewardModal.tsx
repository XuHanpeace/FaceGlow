import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from './GradientButton';

export interface CoinRewardModalRef {
  show: (amount: number) => void;
  hide: () => void;
}

interface CoinRewardModalProps {
  onClose?: () => void;
}

/**
 * 美美币赠予成功弹窗
 */
export const CoinRewardModal = forwardRef<CoinRewardModalRef, CoinRewardModalProps>(
  ({ onClose }, ref) => {
    const [visible, setVisible] = useState(false);
    const [rewardAmount, setRewardAmount] = useState(10);

    useImperativeHandle(ref, () => ({
      show: (amount: number) => {
        setRewardAmount(amount);
        setVisible(true);
      },
      hide: () => {
        setVisible(false);
        onClose?.();
      },
    }));

    const handleClose = () => {
      setVisible(false);
      onClose?.();
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.container} pointerEvents="box-none">
            <LinearGradient
              colors={['#2a2a2a', '#1a1a1a', '#2a2a2a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.content}
            >
              <View style={styles.contentInner}>
                {/* 关闭按钮 */}
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>

                {/* 标题 */}
                <Text style={styles.title}>恭喜获得</Text>

                {/* 奖励金额 */}
                <View style={styles.rewardContainer}>
                  <View style={styles.rewardAmountContainer}>
                    <Text style={styles.rewardAmount}>+{rewardAmount}</Text>
                    <Image
                      source={require('../assets/mm-coins.png')}
                      style={styles.coinIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* 说明文字 */}
                <Text style={styles.description}>
                  新用户首次创作AI头像奖励
                </Text>

                {/* 确认按钮 */}
                <GradientButton
                  title="知道了"
                  onPress={handleClose}
                  style={styles.confirmButton}
                  width={undefined}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  content: {
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  contentInner: {
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 20,
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  coinIcon: {
    width: 48,
    height: 48,
  },
  rewardText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButton: {
    width: '100%',
  },
});

