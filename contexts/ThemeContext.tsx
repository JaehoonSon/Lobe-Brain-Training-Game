import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '~/lib/themes';
import { View } from 'react-native';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('default');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load persisted theme on mount
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
            if (savedTheme) {
                setThemeState(savedTheme as Theme);
            }
            setIsLoaded(true);
        });
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    if (!isLoaded) {
        return null; // Or a splash screen
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <View style={{ flex: 1 }} className={`theme-${theme}`}>
                {children}
            </View>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
