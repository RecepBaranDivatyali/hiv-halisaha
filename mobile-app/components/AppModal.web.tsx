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
  animationType = 'slide',
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      const styleId = 'hiv-app-modal-web-anim-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes hivFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes hivSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .hiv-modal-slide {
            animation: hivFadeIn 0.25s ease-out forwards;
          }
          .hiv-modal-slide > div > div {
            animation: hivSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .hiv-modal-fade {
            animation: hivFadeIn 0.22s ease-out forwards;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (!visible) return null;

  const container = typeof document !== 'undefined' ? document.getElementById('mobile-screen-container') : null;
  const isFramed = Boolean(container);

  const animClass = animationType === 'slide' ? 'hiv-modal-slide' : animationType === 'fade' ? 'hiv-modal-fade' : '';

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
      className={animClass}
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
