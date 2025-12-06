import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface BackButtonProps {
  /**
   * 图标类型：'arrow' 表示左箭头，'close' 表示 X 号
   * @default 'arrow'
   */
  iconType?: 'arrow' | 'close';
  /**
   * 点击回调
   */
  onPress: () => void;
  /**
   * 自定义样式
   */
  style?: ViewStyle;
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;
  /**
   * 是否使用绝对定位
   * @default true
   * 如果为 false，则使用相对定位，适合在 flex 布局中使用
   */
  absolute?: boolean;
}

/**
 * 统一的返回/关闭按钮组件
 * 固定大小 40x40，图标居中，使用 FontAwesome
 */
const BackButton: React.FC<BackButtonProps> = ({
  iconType = 'arrow',
  onPress,
  style,
  disabled = false,
  absolute = true,
}) => {
  const insets = useSafeAreaInsets();
  
  const iconName = iconType === 'close' ? 'times' : 'chevron-left';
  
  // 关闭按钮使用订阅页面的样式：32x32, backgroundColor: rgba(255,255,255,0.2), icon size: 20
  // 返回按钮保持原有样式：40x40, backgroundColor: rgba(255,255,255,0.15), icon size: 18
  const iconSize = iconType === 'close' ? 20 : 18;
  const containerBaseStyle = iconType === 'close' ? styles.closeContainer : styles.container;
  
  const containerStyle = absolute
    ? [
        containerBaseStyle,
        styles.absoluteContainer,
        {
          top: insets.top + 8,
          left: 20, // 默认左侧
        },
        style, // 允许通过 style 覆盖位置
      ]
    : [
        containerBaseStyle,
        styles.relativeContainer,
        style,
      ];
  
  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome
        name={iconName}
        size={iconSize}
        color="#FFFFFF"
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteContainer: {
    position: 'absolute',
    zIndex: 10,
    // left 位置通过内联样式设置，允许覆盖为 right
  },
  relativeContainer: {
    // 相对定位，参与 flex 布局
  },
  icon: {
    // FontAwesome 图标会自动居中，不需要额外样式
  },
});

export default BackButton;

