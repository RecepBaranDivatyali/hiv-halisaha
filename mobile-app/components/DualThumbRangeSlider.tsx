import React, { useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface DualThumbRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  minGap?: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
}

const THUMB_SIZE = 28;

export function DualThumbRangeSlider({
  min = 0,
  max = 10,
  step = 0.5,
  minGap = 0.5,
  minValue,
  maxValue,
  onChange,
}: DualThumbRangeSliderProps) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  // Keep latest values in refs for PanResponder callbacks
  const minValRef = useRef(minValue);
  minValRef.current = minValue;

  const maxValRef = useRef(maxValue);
  maxValRef.current = maxValue;

  const usableWidth = Math.max(1, (trackWidth || 300) - THUMB_SIZE);
  const usableWidthRef = useRef(usableWidth);
  usableWidthRef.current = usableWidth;

  const activeThumbRef = useRef<'min' | 'max' | null>(null);
  const startValRef = useRef<number>(0);

  const rangeSpan = max - min;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,

        onPanResponderGrant: (evt) => {
          const touchX = evt.nativeEvent.locationX;
          const currentMin = minValRef.current;
          const currentMax = maxValRef.current;
          const width = usableWidthRef.current;

          // Position of thumbs relative to container
          const minPos = ((currentMin - min) / rangeSpan) * width + THUMB_SIZE / 2;
          const maxPos = ((currentMax - min) / rangeSpan) * width + THUMB_SIZE / 2;

          const distMin = Math.abs(touchX - minPos);
          const distMax = Math.abs(touchX - maxPos);

          let chosen: 'min' | 'max' = 'min';
          if (distMin < distMax) {
            chosen = 'min';
          } else if (distMax < distMin) {
            chosen = 'max';
          } else {
            chosen = touchX < minPos ? 'min' : 'max';
          }

          activeThumbRef.current = chosen;
          startValRef.current = chosen === 'min' ? currentMin : currentMax;

          // If tapped significantly away from the thumb (direct tap-to-set), adjust immediately:
          if (chosen === 'min' && distMin > THUMB_SIZE * 0.75) {
            const raw = min + ((touchX - THUMB_SIZE / 2) / width) * rangeSpan;
            const stepped = Math.round(raw / step) * step;
            const clamped = Math.max(min, Math.min(stepped, currentMax - minGap));
            startValRef.current = clamped;
            onChange(clamped, currentMax);
          } else if (chosen === 'max' && distMax > THUMB_SIZE * 0.75) {
            const raw = min + ((touchX - THUMB_SIZE / 2) / width) * rangeSpan;
            const stepped = Math.round(raw / step) * step;
            const clamped = Math.max(currentMin + minGap, Math.min(max, stepped));
            startValRef.current = clamped;
            onChange(currentMin, clamped);
          }
        },

        onPanResponderMove: (evt, gestureState) => {
          const width = usableWidthRef.current;
          if (!width || width <= 0) return;

          const deltaVal = (gestureState.dx / width) * rangeSpan;
          const currentMin = minValRef.current;
          const currentMax = maxValRef.current;

          if (activeThumbRef.current === 'min') {
            const raw = startValRef.current + deltaVal;
            const stepped = Math.round(raw / step) * step;
            const clamped = Math.max(min, Math.min(stepped, currentMax - minGap));
            if (clamped !== currentMin) {
              onChange(clamped, currentMax);
            }
          } else if (activeThumbRef.current === 'max') {
            const raw = startValRef.current + deltaVal;
            const stepped = Math.round(raw / step) * step;
            const clamped = Math.max(currentMin + minGap, Math.min(max, stepped));
            if (clamped !== currentMax) {
              onChange(currentMin, clamped);
            }
          }
        },

        onPanResponderRelease: () => {
          activeThumbRef.current = null;
        },
        onPanResponderTerminate: () => {
          activeThumbRef.current = null;
        },
      }),
    [min, max, step, minGap, rangeSpan, onChange]
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - trackWidth) > 1) {
      setTrackWidth(w);
    }
  };

  const leftPosMin = Math.max(0, Math.min(usableWidth, ((minValue - min) / rangeSpan) * usableWidth));
  const leftPosMax = Math.max(0, Math.min(usableWidth, ((maxValue - min) / rangeSpan) * usableWidth));
  const activeWidth = Math.max(0, leftPosMax - leftPosMin);

  return (
    <View style={styles.wrapper}>
      {/* Top Labels Row: Sol Top (Min) vs Sağ Top (Max) */}
      <View style={styles.topInfoRow}>
        <View style={[styles.pillBadge, { borderColor: `${theme.primary}50`, backgroundColor: `${theme.primary}12` }]}>
          <Text style={[styles.pillLabel, { color: theme.textMuted }]}>EN AZ</Text>
          <View style={styles.pillValueWrap}>
            <MaterialIcons name="star" size={13} color={theme.primary} />
            <Text style={[styles.pillValue, { color: theme.primary }]}>
              {minValue === min ? '0.0 (Taban)' : minValue.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.rangeCenterTag}>
          <Text style={[styles.rangeCenterText, { color: theme.textMuted }]}>ARALIK</Text>
          <Text style={[styles.rangeCenterValue, { color: theme.text }]}>
            {minValue.toFixed(1)} - {maxValue.toFixed(1)}
          </Text>
        </View>

        <View style={[styles.pillBadge, { borderColor: `${theme.primary}50`, backgroundColor: `${theme.primary}12` }]}>
          <Text style={[styles.pillLabel, { color: theme.textMuted }]}>EN ÇOK</Text>
          <View style={styles.pillValueWrap}>
            <MaterialIcons name="star" size={13} color={theme.primary} />
            <Text style={[styles.pillValue, { color: theme.primary }]}>
              {maxValue === max ? '10.0 (Tavan)' : maxValue.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Slider Interactive Track Area */}
      <View
        style={[
          styles.trackContainer,
          Platform.OS === 'web' ? ({ userSelect: 'none', cursor: 'pointer' } as any) : null,
        ]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Full Inactive Track Bar */}
        <View style={[styles.inactiveTrack, { backgroundColor: theme.surfaceContainerHighest }]} />

        {/* Active Highlight Bar (Segment between Ball 1 & Ball 2) */}
        <View
          style={[
            styles.activeTrack,
            {
              left: leftPosMin + THUMB_SIZE / 2,
              width: activeWidth,
              backgroundColor: theme.primary,
            },
          ]}
        />

        {/* Left Thumb (Min Rating Ball) */}
        <View
          style={[
            styles.thumb,
            {
              left: leftPosMin,
              backgroundColor: theme.primary,
              borderColor: '#ffffff',
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.thumbInnerDot} />
        </View>

        {/* Right Thumb (Max Rating Ball) */}
        <View
          style={[
            styles.thumb,
            {
              left: leftPosMax,
              backgroundColor: theme.primary,
              borderColor: '#ffffff',
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.thumbInnerDot} />
        </View>
      </View>

      {/* Bottom Ruler Scale Marks */}
      <View style={styles.rulerRow}>
        <Text style={[styles.rulerText, { color: theme.textMuted }]}>0.0</Text>
        <Text style={[styles.rulerText, { color: theme.textMuted }]}>2.5</Text>
        <Text style={[styles.rulerText, { color: theme.textMuted }]}>5.0</Text>
        <Text style={[styles.rulerText, { color: theme.textMuted }]}>7.5</Text>
        <Text style={[styles.rulerText, { color: theme.textMuted }]}>10.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 4,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  pillLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pillValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pillValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
  },
  rangeCenterTag: {
    alignItems: 'center',
  },
  rangeCenterText: {
    fontFamily: Fonts.body,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  rangeCenterValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
  },
  trackContainer: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  inactiveTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  activeTrack: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: 8,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 5,
  },
  thumbInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  rulerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  rulerText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
});
