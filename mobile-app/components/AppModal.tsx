import React from 'react';
import { Modal as RNModal, ModalProps } from 'react-native';

export interface AppModalProps extends ModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  onRequestClose,
  transparent = true,
  animationType = 'fade',
  children,
  ...rest
}) => {
  return (
    <RNModal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onRequestClose || onClose}
      {...rest}
    >
      {children}
    </RNModal>
  );
};

export default AppModal;
