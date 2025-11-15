import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastData {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, type, message, duration }]);
    }, []);

    const success = useCallback((message: string, duration = 3000) => {
        showToast('success', message, duration);
    }, [showToast]);

    const error = useCallback((message: string, duration = 3000) => {
        showToast('error', message, duration);
    }, [showToast]);

    const info = useCallback((message: string, duration = 3000) => {
        showToast('info', message, duration);
    }, [showToast]);

    const warning = useCallback((message: string, duration = 3000) => {
        showToast('warning', message, duration);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            {/* Toast Container - Fixed positioning with proper mobile spacing */}
            <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[9999] flex flex-col gap-2 sm:gap-3 max-w-[calc(100vw-1rem)] sm:max-w-md pointer-events-none">
                <div className="flex flex-col gap-2 sm:gap-3 pointer-events-auto">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            type={toast.type}
                            message={toast.message}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
