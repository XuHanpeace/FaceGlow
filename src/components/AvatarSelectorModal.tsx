import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Modal } from './modal';
import { colors } from '../config/theme';
import { useUserSelfies } from '../hooks/useUser';

interface AvatarSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (selfieUrl: string | null) => void;
}

/**
 * 头像选择半屏弹窗
 * 可以从自拍中选择一张作为头像，或选择默认头像
 */
const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { selfies, hasSelfies } = useUserSelfies();

  const handleSelectSelfie = (selfieUrl: string) => {
    onSelect(selfieUrl);
    onClose();
  };

  const handleSelectDefault = () => {
    onSelect(null); // null 表示使用默认头像
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} maskClosable={true}>
      <View style={styles.content}>
        {/* 标题 */}
        <Text style={styles.title}>选择头像</Text>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 默认头像选项 */}
          <TouchableOpacity
            style={styles.avatarOption}
            onPress={handleSelectDefault}
            activeOpacity={0.7}
          >
            <View style={styles.defaultAvatarContainer}>
              <FontAwesome name="user-circle" size={45} color="#ccc" />
            </View>
            <Text style={styles.avatarLabel}>默认头像</Text>
          </TouchableOpacity>

          {/* 自拍列表 */}
          {hasSelfies ? (
            selfies.map((selfie) => (
              <TouchableOpacity
                key={selfie.id}
                style={styles.avatarOption}
                onPress={() => handleSelectSelfie(selfie.url)}
                activeOpacity={0.7}
              >
                <View style={styles.selfieContainer}>
                  <FastImage
                    source={selfie.source}
                    style={styles.selfieImage}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                </View>
                <Text style={styles.avatarLabel} numberOfLines={1}>
                  自拍
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无自拍</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 40,
    minHeight: 400,
    maxHeight: 600,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
    paddingHorizontal: 8,
  },
  avatarOption: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16,
  },
  defaultAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selfieContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selfieImage: {
    width: 60,
    height: 60,
  },
  avatarLabel: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});

export default AvatarSelectorModal;

