import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface AppModalProps {
  visible: boolean;
  onClose?: () => void;
  onRequestClose?: () => void;
  children: React.ReactNode;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  zIndex?: number;
  [key: string]: any;
}

interface ModalStackEntry {
  id: number;
  getClose: () => (() => void) | undefined;
}

// Modül düzeyinde modal stack ve referans sayaçlı body scroll kilidi
const modalStack: ModalStackEntry[] = [];
let nextModalId = 1;
let escListenerAttached = false;
let bodyScrollLockCount = 0;
let savedBodyOverflow: string | null = null;

const handleGlobalEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || modalStack.length === 0) return;
  const topModal = modalStack[modalStack.length - 1];
  const closeHandler = topModal?.getClose();
  if (closeHandler) {
    event.preventDefault();
    event.stopPropagation();
    closeHandler();
  }
};

const attachEscapeListener = () => {
  if (typeof window === 'undefined' || escListenerAttached) return;
  window.addEventListener('keydown', handleGlobalEscape, true);
  escListenerAttached = true;
};

const detachEscapeListenerIfEmpty = () => {
  if (typeof window === 'undefined' || !escListenerAttached || modalStack.length > 0) return;
  window.removeEventListener('keydown', handleGlobalEscape, true);
  escListenerAttached = false;
};

const acquireBodyScrollLock = () => {
  if (typeof document === 'undefined' || !document.body) return;
  if (bodyScrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyScrollLockCount += 1;
};

const releaseBodyScrollLock = () => {
  if (typeof document === 'undefined' || !document.body || bodyScrollLockCount <= 0) return;
  bodyScrollLockCount -= 1;
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow ?? '';
    savedBodyOverflow = null;
  }
};

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  onRequestClose,
  animationType = 'slide',
  zIndex,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const [stackDepth, setStackDepth] = useState(1);
  const modalIdRef = useRef<number>(0);
  if (modalIdRef.current === 0) {
    modalIdRef.current = nextModalId++;
  }

  const closeCallbackRef = useRef<(() => void) | undefined>(onRequestClose || onClose);
  closeCallbackRef.current = onRequestClose || onClose;

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
            animation: hivFadeIn 0.22s ease-out forwards;
          }
          .hiv-modal-slide > div > div {
            animation: hivSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .hiv-modal-fade {
            animation: hivFadeIn 0.2s ease-out forwards;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  useEffect(() => {
    if (!visible || !mounted) return;

    const myId = modalIdRef.current;
    const entry: ModalStackEntry = {
      id: myId,
      getClose: () => closeCallbackRef.current,
    };

    const existingIdx = modalStack.findIndex((item) => item.id === myId);
    if (existingIdx !== -1) {
      modalStack.splice(existingIdx, 1);
    }
    modalStack.push(entry);
    setStackDepth(modalStack.length);
    attachEscapeListener();

    const container = typeof document !== 'undefined' ? document.getElementById('mobile-screen-container') : null;
    const isFramedNow = Boolean(container);
    if (!isFramedNow) {
      acquireBodyScrollLock();
    }

    return () => {
      const idx = modalStack.findIndex((item) => item.id === myId);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }
      detachEscapeListenerIfEmpty();
      if (!isFramedNow) {
        releaseBodyScrollLock();
      }
    };
  }, [visible, mounted]);

  if (!visible || !mounted) return null;

  const container = typeof document !== 'undefined' ? document.getElementById('mobile-screen-container') : null;
  const isFramed = Boolean(container);

  const animClass =
    animationType === 'slide'
      ? 'hiv-modal-slide'
      : animationType === 'fade'
        ? 'hiv-modal-fade'
        : undefined;

  const effectiveZIndex = typeof zIndex === 'number' ? zIndex : 99900 + stackDepth;

  const content = (
    <div
      className={animClass}
      role="dialog"
      aria-modal="true"
      style={{
        position: isFramed ? 'absolute' : 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: effectiveZIndex,
      }}
    >
      {children}
    </div>
  );

  if (typeof document !== 'undefined') {
    const target = container || document.body;
    return createPortal(content, target);
  }

  return content;
};

export default AppModal;
