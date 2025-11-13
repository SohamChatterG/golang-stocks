import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Temporary diagnostic component to debug dark mode
 * Add this to any page to see the current theme state
 */
const ThemeDebug: React.FC = () => {
    const { dark, toggle } = useTheme();
    const htmlClass = document.documentElement.className;
    const storedTheme = localStorage.getItem('theme');

    return (
        <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500 dark:border-yellow-600 rounded-lg p-4 shadow-lg z-50 max-w-sm">
            <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">🔧 Theme Debug</h3>
            <div className="space-y-1 text-xs text-yellow-900 dark:text-yellow-100">
                <div><strong>Context dark:</strong> {String(dark)}</div>
                <div><strong>HTML class:</strong> "{htmlClass}"</div>
                <div><strong>localStorage:</strong> {storedTheme || 'null'}</div>
                <div><strong>Should be dark:</strong> {dark ? 'YES' : 'NO'}</div>
            </div>
            <button
                onClick={() => {
                    console.log('Debug toggle clicked');
                    toggle();
                }}
                className="mt-3 w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold"
            >
                Toggle (Test)
            </button>
            <div className="mt-2 text-xs text-yellow-800 dark:text-yellow-200">
                This box should change color when toggling
            </div>
        </div>
    );
};

export default ThemeDebug;
