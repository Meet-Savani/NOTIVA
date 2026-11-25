import { useEffect, useState } from 'react';

export const getActiveTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent('notiva-theme-change', { detail: { theme } }));
};

export const toggleTheme = () => {
    const current = getActiveTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
};

// Hook for reactive theme state
export const useTheme = () => {
    const [theme, setTheme] = useState(getActiveTheme);

    useEffect(() => {
        const handleThemeChange = (e) => {
            setTheme(e.detail?.theme || getActiveTheme());
        };

        window.addEventListener('notiva-theme-change', handleThemeChange);
        return () => window.removeEventListener('notiva-theme-change', handleThemeChange);
    }, []);

    return {
        theme,
        isDark: theme === 'dark',
        toggleTheme,
    };
};
