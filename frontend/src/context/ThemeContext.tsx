import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
    dark: boolean;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dark, setDark] = useState<boolean>(() => {
        // Initialize from localStorage on mount
        const stored = localStorage.getItem('theme');
        const isDark = stored === 'dark';
        console.log('ThemeProvider initializing - stored:', stored, 'isDark:', isDark);
        // Apply immediately to avoid flash
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        console.log('Initial HTML classList:', document.documentElement.className);
        return isDark;
    });

    const toggle = () => {
        console.log('Toggle called! Current dark state:', dark);
        setDark(prev => {
            const next = !prev;
            console.log('Toggling from', prev, 'to', next);
            if (next) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                console.log('Added dark class');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                console.log('Removed dark class');
            }
            console.log('HTML classList after toggle:', document.documentElement.className);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};
