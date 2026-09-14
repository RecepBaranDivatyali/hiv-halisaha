import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createPortal } from 'react-dom';

export interface AppModalProps {
  visible: boolean;
  onClose?: () => void;
  onRequestClose?: () => void;
  children: React.ReactNode;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  [key: string]: any;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!visible) return null;

  const container = typeof document !== 'undefined' ? document.getElementById('mobile-screen-container') : null;
  const isFramed = Boolean(container);

  const content = (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          position: isFramed ? 'absolute' : 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 99999,
          elevation: 99999,
        } as any,
      ]}
    >
      {children}
    </View>
  );

  if (typeof document !== 'undefined' && mounted) {
    const target = container || document.body;
    return createPortal(content, target);
  }

  return content;
};

export default AppModal;
