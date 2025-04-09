import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  TextInputProps 
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Input({ 
  label, 
  error, 
  fullWidth = false,
  style,
  ...props 
}: InputProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const errorColor = '#e11d48';

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { 
            color: textColor,
            backgroundColor,
            borderColor: error ? errorColor : borderColor 
          },
          style
        ]}
        placeholderTextColor={borderColor}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: errorColor }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
});