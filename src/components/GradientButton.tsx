import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { themeColors } from '../config/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  width?: number;
  height?: number;
  fontSize?: number;
  borderRadius?: number;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  icon,
  width,
  height,
  fontSize,
  borderRadius,
  colors,
  start,
  end,
}) => {
  const gradientConfig = themeColors[variant];
  const isDisabled = disabled || loading;

  // 尺寸配置
  const sizeConfig = {
    small: { width: 70, height: 30, fontSize: 12, borderRadius: 20 },
    medium: { width: 120, height: 40, fontSize: 16, borderRadius: 22 },
    large: { width: undefined, height: 44, fontSize: 18, borderRadius: 25 },
  };

  const config = sizeConfig[size];
  const buttonWidth = width || config.width;
  const buttonHeight = height || config.height;
  const buttonFontSize = fontSize || config.fontSize;
  const buttonBorderRadius = borderRadius || config.borderRadius;

  // 渐变配置
  const gradientColors = colors || (isDisabled ? ['#CCCCCC', '#999999'] : gradientConfig.gradient);
  const gradientStart = start || gradientConfig.start;
  const gradientEnd = end || gradientConfig.end;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          width: buttonWidth,
          height: buttonHeight,
          borderRadius: buttonBorderRadius,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={gradientStart}
        end={gradientEnd}
        style={[
          styles.gradient,
          {
            borderRadius: buttonBorderRadius,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                styles.text,
                {
                  fontSize: buttonFontSize,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default GradientButton;