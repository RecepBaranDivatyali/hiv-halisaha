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

const THUMB_SIZE = 26;
const TRACK_HEIGHT = 6;
const HIT_AREA = 48;

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

  // All mutable state lives in refs so PanResponder always reads latest values
  const minRef = useRef(minValue);
  const maxRef = useRef(maxValue);
  minRef.current = minValue;
  maxRef.current = maxValue;

  const activeThumb = useRef<'min' | 'max' | null>(null);
  const dragStartTouch = useRef(0);   // pageX at gesture start
  const dragStartValue = useRef(0);   // value of thumb at gesture start

  const rangeSpan = max - min;

  const valueToX = useCallback(
    (val: number) => {
      const w = trackWidthRef.current;
      if (!w) return 0;
      return ((val - min) / rangeSpan) * (w - THUMB_SIZE);
    },
    [min, rangeSpan]
  );

  const xToValue = useCallback(
    (x: number) => {
      const w = trackWidthRef.current;
      if (!w) return min;
      return min + (x / (w - THUMB_SIZE)) * rangeSpan;
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
        const touchX = evt.nativeEvent.locationX;
        const curMin = minRef.current;
        const curMax = maxRef.current;

        const minX = valueToX(curMin) + THUMB_SIZE / 2;
        const maxX = valueToX(curMax) + THUMB_SIZE / 2;

        const dMin = Math.abs(touchX - minX);
        const dMax = Math.abs(touchX - maxX);

        let which: 'min' | 'max';
        if (dMin <= dMax) {
          which = 'min';
        } else {
          which = 'max';
        }

        activeThumb.current = which;
        dragStartTouch.current = evt.nativeEvent.pageX;
        dragStartValue.current = which === 'min' ? curMin : curMax;
      },

      onPanResponderMove: (_evt, gestureState) => {
        const w = trackWidthRef.current;
        if (!w) return;

        const curMin = minRef.current;
        const curMax = maxRef.current;
        const deltaVal = (gestureState.dx / (w - THUMB_SIZE)) * rangeSpan;
        const rawVal = dragStartValue.current + deltaVal;
        const snapped = snap(rawVal, min, step);

        if (activeThumb.current === 'min') {
          const clamped = Math.max(min, Math.min(snapped, curMax - minGap));
          if (Math.abs(clamped - curMin) >= step * 0.4) {
            onChange(parseFloat(clamped.toFixed(1)), curMax);
          }
        } else if (activeThumb.current === 'max') {
          const clamped = Math.max(curMin + minGap, Math.min(max, snapped));
          if (Math.abs(clamped - curMax) >= step * 0.4) {
            onChange(curMin, parseFloat(clamped.toFixed(1)));
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

  const isAllRange = minValue === min && maxValue === max;

  return (
    <View style={styles.wrapper}>

      {/* Value Display Row */}
      <View style={styles.valueRow}>
        {/* Min Badge */}
        <View style={[styles.valueBadge, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` }]}>
          <Text style={[styles.valueBadgeLabel, { color: theme.textMuted }]}>EN AZ</Text>
          <Text style={[styles.valueBadgeNum, { color: theme.primary }]}>
            {minValue.toFixed(1)}
          </Text>
        </View>

        {/* Center Range Indicator */}
        <View style={styles.centerLabel}>
          {isAllRange ? (
            <Text style={[styles.centerLabelAll, { color: theme.textMuted }]}>TÜM PUANLAR</Text>
          ) : (
            <>
              <Text style={[styles.centerLabelRange, { color: theme.text }]}>
                {minValue.toFixed(1)} – {maxValue.toFixed(1)}
              </Text>
              <Text style={[styles.centerLabelSub, { color: theme.textMuted }]}>puan aralığı</Text>
            </>
          )}
        </View>

        {/* Max Badge */}
        <View style={[styles.valueBadge, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` }]}>
          <Text style={[styles.valueBadgeLabel, { color: theme.textMuted }]}>EN ÇOK</Text>
          <Text style={[styles.valueBadgeNum, { color: theme.primary }]}>
            {maxValue.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Slider Track Area */}
      <View
        style={[
          styles.trackHitArea,
          Platform.OS === 'web' ? ({ userSelect: 'none' } as any) : null,
        ]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Grey background track */}
        <View
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
          style={[
            styles.trackActive,
            {
              left: activeLeft,
              width: activeWidth,
              backgroundColor: theme.primary,
            },
          ]}
        />

        {/* Min Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: leftMin,
              backgroundColor: '#ffffff',
              borderColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.thumbCore, { backgroundColor: theme.primary }]} />
        </View>

        {/* Max Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: leftMax,
              backgroundColor: '#ffffff',
              borderColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.thumbCore, { backgroundColor: theme.primary }]} />
        </View>
      </View>

      {/* Scale Labels */}
      <View style={styles.scaleRow}>
        {['0', '2.5', '5', '7.5', '10'].map((label) => (
          <Text key={label} style={[styles.scaleLabel, { color: theme.textMuted }]}>
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
    paddingTop: 2,
    paddingBottom: 4,
  },

  // Value display
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  valueBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 72,
  },
  valueBadgeLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  valueBadgeNum: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
  },
  centerLabel: {
    flex: 1,
    alignItems: 'center',
  },
  centerLabelAll: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  centerLabelRange: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
  },
  centerLabelSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    marginTop: 1,
  },

  // Track
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
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  thumbCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Scale
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
