import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
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

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 4;
const HIT_AREA = 36;

function snap(value: number, min: number, step: number): number {
  return Math.round((value - min) / step) * step + min;
}

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
  const trackWidthRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // All mutable state & props live in refs so PanResponder always reads latest values
  const minRef = useRef(minValue);
  const maxRef = useRef(maxValue);
  minRef.current = minValue;
  maxRef.current = maxValue;

  const propsRef = useRef({ min, max, step, minGap, onChange });
  propsRef.current = { min, max, step, minGap, onChange };

  const activeThumb = useRef<'min' | 'max' | null>(null);
  const dragStartValue = useRef(0);

  const rangeSpan = Math.max(1e-6, max - min);

  const valueToX = useCallback(
    (val: number) => {
      const w = trackWidthRef.current;
      if (!w || w <= THUMB_SIZE || rangeSpan <= 0) return 0;
      const ratio = Math.min(1, Math.max(0, (val - min) / rangeSpan));
      return ratio * (w - THUMB_SIZE);
    },
    [min, rangeSpan]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        const w = trackWidthRef.current;
        if (!w || w <= THUMB_SIZE) return;

        const { min: pMin, max: pMax } = propsRef.current;
        const span = Math.max(1e-6, pMax - pMin);
        const touchX = evt.nativeEvent.locationX;
        const curMin = minRef.current;
        const curMax = maxRef.current;

        const minX = ((curMin - pMin) / span) * (w - THUMB_SIZE) + THUMB_SIZE / 2;
        const maxX = ((curMax - pMin) / span) * (w - THUMB_SIZE) + THUMB_SIZE / 2;

        const dMin = Math.abs(touchX - minX);
        const dMax = Math.abs(touchX - maxX);

        let which: 'min' | 'max';
        if (dMin <= dMax) {
          which = 'min';
        } else {
          which = 'max';
        }

        activeThumb.current = which;
        dragStartValue.current = which === 'min' ? curMin : curMax;
      },

      onPanResponderMove: (_evt, gestureState) => {
        const w = trackWidthRef.current;
        if (!w || w <= THUMB_SIZE) return;

        const { min: pMin, max: pMax, step: pStep, minGap: pGap, onChange: pOnChange } = propsRef.current;
        const span = pMax - pMin;
        if (span <= 0) return;

        const curMin = minRef.current;
        const curMax = maxRef.current;
        const deltaVal = (gestureState.dx / (w - THUMB_SIZE)) * span;
        const rawVal = dragStartValue.current + deltaVal;
        const snapped = snap(rawVal, pMin, pStep);

        if (activeThumb.current === 'min') {
          const clamped = Math.max(pMin, Math.min(snapped, curMax - pGap));
          if (Math.abs(clamped - curMin) >= pStep * 0.4) {
            pOnChange(parseFloat(clamped.toFixed(1)), curMax);
          }
        } else if (activeThumb.current === 'max') {
          const clamped = Math.max(curMin + pGap, Math.min(pMax, snapped));
          if (Math.abs(clamped - curMax) >= pStep * 0.4) {
            pOnChange(curMin, parseFloat(clamped.toFixed(1)));
          }
        }
      },

      onPanResponderRelease: () => {
        activeThumb.current = null;
      },
      onPanResponderTerminate: () => {
        activeThumb.current = null;
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - trackWidthRef.current) > 2) {
      trackWidthRef.current = w;
      forceUpdate(n => n + 1);
    }
  };

  const leftMin = valueToX(minValue);
  const leftMax = valueToX(maxValue);
  const activeLeft = leftMin + THUMB_SIZE / 2;
  const activeWidth = Math.max(0, leftMax - leftMin);
  const scaleLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const val = min + (max - min) * t;
    return Number.isInteger(val) ? String(val) : val.toFixed(1);
  });

  return (
    <View style={styles.wrapper}>
      {/* Slider Interactive Track Area */}
      <View
        style={[
          styles.trackHitArea,
          Platform.OS === 'web' ? ({ userSelect: 'none', cursor: 'pointer', touchAction: 'none' } as any) : null,
        ]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Grey background track */}
        <View
          pointerEvents="none"
          style={[
            styles.trackBg,
            {
              left: THUMB_SIZE / 2,
              right: THUMB_SIZE / 2,
              backgroundColor: theme.surfaceContainerHighest,
            },
          ]}
        />

        {/* Active (colored) segment between thumbs */}
        <View
          pointerEvents="none"
          style={[
            styles.trackActive,
            {
              left: activeLeft,
              width: activeWidth,
              backgroundColor: theme.primary,
            },
          ]}
        />

        {/* Min Thumb (Sleek minimalist white knob) */}
        <View
          style={[
            styles.thumb,
            {
              left: leftMin,
              backgroundColor: '#FFFFFF',
            },
          ]}
          pointerEvents="none"
        />

        {/* Max Thumb (Sleek minimalist white knob) */}
        <View
          style={[
            styles.thumb,
            {
              left: leftMax,
              backgroundColor: '#FFFFFF',
            },
          ]}
          pointerEvents="none"
        />
      </View>

      {/* Scale Labels */}
      <View style={styles.scaleRow}>
        {scaleLabels.map((label, idx) => (
          <Text key={`${label}-${idx}`} style={[styles.scaleLabel, { color: theme.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 2,
  },
  trackHitArea: {
    width: '100%',
    height: HIT_AREA,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  trackActive: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: (HIT_AREA - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THUMB_SIZE / 2,
    marginTop: 2,
  },
  scaleLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    textAlign: 'center',
  },
});
