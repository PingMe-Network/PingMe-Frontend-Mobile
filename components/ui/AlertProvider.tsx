import React, { createContext, useContext, useState, useCallback } from "react";
import { CustomAlert, type AlertType } from "./CustomAlert";
import { useAppSelector } from "@/features/store";

type AlertOptions = {
    type: AlertType;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
};

type AlertContextType = {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    const [alertState, setAlertState] = useState<{
        visible: boolean;
        options: AlertOptions | null;
    }>({
        visible: false,
        options: null,
    });

    const showAlert = useCallback((options: AlertOptions) => {
        setAlertState({
            visible: true,
            options,
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState((prev) => ({ ...prev, visible: false }));
        // Clear options after animation
        setTimeout(() => {
            setAlertState({ visible: false, options: null });
        }, 300);
    }, []);

    const handleConfirm = useCallback(() => {
        alertState.options?.onConfirm?.();
        hideAlert();
    }, [alertState.options, hideAlert]);

    const handleCancel = useCallback(() => {
        alertState.options?.onCancel?.();
        hideAlert();
    }, [alertState.options, hideAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alertState.options && (
                <CustomAlert
                    visible={alertState.visible}
                    type={alertState.options.type}
                    title={alertState.options.title}
                    message={alertState.options.message}
                    isDark={isDark}
                    confirmText={alertState.options.confirmText}
                    cancelText={alertState.options.cancelText}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within AlertProvider");
    }
    return context;
}
