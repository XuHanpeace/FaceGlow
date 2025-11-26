import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { themeColors, colors } from '../config/theme';

interface CustomToastProps {
  type?: 'success' | 'error' | 'info' | 'warn';
  text1?: string;
  text2?: string;
  hide: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ type = 'info', text1, text2, hide }) => {
  // 动画值：从顶部滑入
  const slideAnim = useRef(new Animated.Value(-100)).current; // 初始位置在屏幕外（上方）
  const opacityAnim = useRef(new Animated.Value(0)).current; // 初始透明度为0

  // 组件挂载时触发滑入动画
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, // 滑到最终位置
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, // 淡入
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  // 根据类型选择颜色和图标
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          gradient: themeColors.success.gradient,
          icon: 'check-circle',
          iconColor: colors.white,
        };
      case 'error':
        return {
          gradient: themeColors.error.gradient,
          icon: 'times-circle',
          iconColor: colors.white,
        };
      case 'info':
        return {
          gradient: themeColors.secondary.gradient,
          icon: 'info-circle',
          iconColor: colors.white,
        };
      case 'warn':
        return {
          gradient: themeColors.warning.gradient,
          icon: 'exclamation-circle',
          iconColor: colors.white,
        };
      default:
        return {
          gradient: themeColors.primary.gradient,
          icon: 'bell',
          iconColor: colors.white,
        };
    }
  };

  const config = getToastConfig();
  
  // 处理消息显示：如果有 text2，text1 作为标题；如果只有 text1，作为主消息
  const hasTitle = text1 && text2;
  const displayTitle = hasTitle ? text1 : undefined;
  const displayMessage = text2 || text1 || '';

  // 处理关闭：先播放滑出动画，然后调用hide
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100, // 滑回顶部
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0, // 淡出
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hide(); // 动画完成后调用hide
    });
  };

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleClose}
        style={styles.container}
      >
      <LinearGradient
        colors={config.gradient}
        start={themeColors.primary.start}
        end={themeColors.primary.end}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <FontAwesome
            name={config.icon}
            size={24}
            color={config.iconColor}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            {displayTitle && <Text style={styles.title}>{displayTitle}</Text>}
            <Text style={styles.message}>{displayMessage}</Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome
              name="times"
              size={18}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 25, // 增加顶部间距，避免被灵动岛挡住
  },
  container: {
    width: '90%',
    marginHorizontal: '5%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 12,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
    flexShrink: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default CustomToast;

