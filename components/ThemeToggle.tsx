import React from 'react';

interface ThemeToggleProps {
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
        // Get from localStorage or default to light
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    });

    React.useEffect(() => {
        // Apply theme to document root
        document.documentElement.setAttribute('data-theme', theme);

        // Also add/remove 'dark' class for Tailwind dark mode
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                } ${className}`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                // Moon icon (dark mode)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            ) : (
                // Sun icon (light mode)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )}
        </button>
    );
};
