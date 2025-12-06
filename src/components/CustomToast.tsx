import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { themeColors, colors } from '../config/theme';
import { ToastConfigParams } from 'toastify-react-native/utils/interfaces';

const CustomToast: React.FC<ToastConfigParams> = ({ type = 'info', text1, text2, hide }) => {
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

  return (
    <View style={styles.containerWrapper} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hide}
        style={styles.container}
        pointerEvents="auto"
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
              onPress={hide}
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
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10, // 调整顶部间距，留给库的动画空间
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
