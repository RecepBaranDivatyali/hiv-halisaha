import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface CustomInputProps extends TextInputProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  icon,
  label,
  error,
  isPassword,
  containerStyle,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor: isError ? theme.error : isFocused ? theme.primary : theme.border,
          },
        ]}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={isError ? theme.error : isFocused ? theme.primary : theme.icon}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={theme.icon}
            />
          </TouchableOpacity>
        )}
      </View>

      {isError && (
        <Animated.View entering={FadeInDown.duration(200)}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 8,
    marginRight: -8,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
