import { Alert, Platform } from 'react-native';

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface AppAlertRequest {
  id: string;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void;
}

type AppAlertListener = (request: AppAlertRequest | null) => void;

let currentRequest: AppAlertRequest | null = null;
const requestQueue: AppAlertRequest[] = [];
const listeners = new Set<AppAlertListener>();
let idCounter = 0;

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(currentRequest);
    } catch (err) {
      console.warn('AppAlert listener error:', err);
    }
  });
}

function showNext() {
  if (currentRequest || requestQueue.length === 0) {
    notifyListeners();
    return;
  }
  currentRequest = requestQueue.shift() || null;
  notifyListeners();
}

function fallbackAlert(
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
  options?: AppAlertOptions
) {
  const normalizedButtons: AppAlertButton[] =
    Array.isArray(buttons) && buttons.length > 0
      ? buttons
      : [{ text: 'Tamam', style: 'default' }];

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const fullText = message ? `${title}\n\n${message}` : title;
    if (normalizedButtons.length <= 1) {
      window.alert(fullText);
      normalizedButtons[0]?.onPress?.();
      return;
    }

    const cancelBtn = normalizedButtons.find((b) => b.style === 'cancel');
    const actionBtns = normalizedButtons.filter((b) => b.style !== 'cancel');

    if (actionBtns.length === 1) {
      const confirmed = window.confirm(fullText);
      if (confirmed) {
        actionBtns[0]?.onPress?.();
      } else {
        if (cancelBtn?.onPress) cancelBtn.onPress();
        else options?.onDismiss?.();
      }
      return;
    }

    // Multiple options fallback on web when host isn't mounted
    const choicesText = normalizedButtons.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
    const input = window.prompt(`${fullText}\n\n${choicesText}`, '1');
    if (input === null) {
      if (cancelBtn?.onPress) cancelBtn.onPress();
      else options?.onDismiss?.();
      return;
    }
    const idx = parseInt(input.trim(), 10) - 1;
    if (!isNaN(idx) && normalizedButtons[idx]) {
      normalizedButtons[idx].onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
    return;
  }

  Alert.alert(title, message, normalizedButtons, options);
}

export const appAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions
  ): void {
    const normalizedButtons: AppAlertButton[] =
      Array.isArray(buttons) && buttons.length > 0
        ? buttons
        : [{ text: 'Tamam', style: 'default' }];

    if (listeners.size === 0) {
      fallbackAlert(title, message, normalizedButtons, options);
      return;
    }

    const req: AppAlertRequest = {
      id: `app_alert_${++idCounter}_${Date.now()}`,
      title,
      message,
      buttons: normalizedButtons,
      cancelable: options?.cancelable !== undefined ? options.cancelable : true,
      onDismiss: options?.onDismiss,
    };

    if (!currentRequest) {
      currentRequest = req;
      notifyListeners();
    } else {
      requestQueue.push(req);
    }
  },

  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
      onCancel?: () => void;
    }
  ): void {
    appAlert.alert(
      title,
      message,
      [
        {
          text: options?.cancelText || 'İptal',
          style: 'cancel',
          onPress: options?.onCancel,
        },
        {
          text: options?.confirmText || 'Onayla',
          style: options?.destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
      { cancelable: true, onDismiss: options?.onCancel }
    );
  },

  choose(
    title: string,
    message: string | undefined,
    buttons: AppAlertButton[],
    options?: AppAlertOptions
  ): void {
    appAlert.alert(title, message, buttons, options);
  },

  subscribe(listener: AppAlertListener): () => void {
    listeners.add(listener);
    listener(currentRequest);
    return () => {
      listeners.delete(listener);
    };
  },

  dismiss(): void {
    currentRequest = null;
    if (requestQueue.length > 0) {
      currentRequest = requestQueue.shift() || null;
    }
    notifyListeners();
  },
};

export default appAlert;
