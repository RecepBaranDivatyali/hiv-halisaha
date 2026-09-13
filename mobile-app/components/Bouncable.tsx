import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface BouncableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Bouncable: React.FC<BouncableProps> = ({ 
  children, 
  style, 
  scaleTo = 0.95,
  onPressIn,
  onPressOut,
  ...props 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    if (props.disabled) return;
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200, mass: 0.5 });
    if (onPressIn) onPressIn(e);
  }, [scale, scaleTo, onPressIn, props.disabled]);

  const handlePressOut = useCallback((e: GestureResponderEvent) => {
    if (props.disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 200, mass: 0.5 });
    if (onPressOut) onPressOut(e);
  }, [scale, onPressOut, props.disabled]);

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};
