import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacityProps 
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  title, 
  variant = 'primary', 
  isLoading = false, 
  fullWidth = false,
  style,
  disabled,
  ...props 
}: ButtonProps) {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'background');
  const backgroundColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'tint');
  
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor,
          borderColor: 'transparent',
          buttonTextColor: textColor,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: backgroundColor,
          buttonTextColor: primaryColor,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor,
          buttonTextColor: primaryColor,
        };
      default:
        return {
          backgroundColor,
          borderColor: 'transparent',
          buttonTextColor: textColor,
        };
    }
  };

  const { backgroundColor: bgColor, borderColor: bdColor, buttonTextColor } = getButtonStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor: bdColor },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={buttonTextColor} />
      ) : (
        <Text style={[styles.text, { color: buttonTextColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});