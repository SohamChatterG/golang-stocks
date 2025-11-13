import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavButtonProps {
    to: string;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ to, children, variant = 'primary', onClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === to;

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(to);
        }
    };

    const getVariantClasses = () => {
        if (isActive) {
            switch (variant) {
                case 'primary':
                    return 'bg-blue-600 text-white shadow-lg shadow-blue-500/50';
                case 'secondary':
                    return 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50';
                case 'danger':
                    return 'bg-red-600 text-white shadow-lg shadow-red-500/50';
            }
        }

        switch (variant) {
            case 'primary':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30';
            case 'secondary':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30';
            case 'danger':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30';
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${getVariantClasses()}
                ${isActive ? 'ring-2 ring-offset-2 ring-offset-slate-900 dark:ring-offset-slate-950' : ''}
            `}
        >
            {children}
        </button>
    );
};

export default NavButton;
