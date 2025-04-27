import { useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<{ visible: boolean } & ToastMessage>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (toast: ToastMessage) => {
    setToast({
      ...toast,
      visible: true
    });

    setTimeout(() => {
      setToast(prev => ({
        ...prev,
        visible: false
      }));
    }, 5000);
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      visible: false
    }));
  };

  return {
    toast,
    showToast,
    hideToast
  };
}

export default useToast; 