// src/contexts/ThemeContext.tsx - Dynamic theme provider for multi-tenant
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, type ThemeConfig } from '../config/themes';
import { supabase } from '../lib/supabase';

interface ThemeContextType {
  theme: ThemeConfig;
  isLoading: boolean;
  reloadTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(themes['dxc']); // Default
  const [isLoading, setIsLoading] = useState(true);

  const loadUserTheme = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // Not authenticated, use default theme from env
        const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
        setTheme(themes[defaultThemeName] || themes['dxc']);
        setIsLoading(false);
        return;
      }

      console.log('🎨 Loading theme for authenticated user:', user.email);

      // Get user data with client info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('client_id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData?.client_id) {
        // User without client (super admin?) or error
        console.log('🎨 User without client_id (super admin?), using default theme');
        const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
        setTheme(themes[defaultThemeName] || themes['dxc']);
        setIsLoading(false);
        return;
      }

      console.log('🎨 User client_id:', userData.client_id);

      // Get client settings
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('settings')
        .eq('id', userData.client_id)
        .single();

      if (clientError || !clientData?.settings) {
        console.warn('🎨 No client settings found, using default theme');
        const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
        setTheme(themes[defaultThemeName] || themes['dxc']);
        setIsLoading(false);
        return;
      }

      // Load theme from client settings
      const clientSettings = clientData.settings as any;
      const themeName = clientSettings.theme || 'dxc';
      
      console.log('🎨 Client settings:', clientSettings);
      console.log('🎨 Client theme:', themeName, 'for client:', userData.client_id);
      
      // Start with base theme
      let clientTheme = themes[themeName] || themes['dxc'];
      
      // ⭐ OVERRIDE with client-specific settings from DB if available
      if (clientSettings.primary_color || clientSettings.logo) {
        console.log('🎨 Applying custom theme from DB settings');
        
        clientTheme = {
          ...clientTheme,
          colors: {
            ...clientTheme.colors,
            // Override primary color if specified
            ...(clientSettings.primary_color && {
              primary: clientSettings.primary_color,
              buttonPrimary: clientSettings.primary_color,
              tabActive: clientSettings.primary_color,
              checkboxChecked: clientSettings.primary_color,
              sidebar: clientSettings.primary_color,
            }),
            // Override secondary color if specified
            ...(clientSettings.secondary_color && {
              secondary: clientSettings.secondary_color,
            }),
          },
          logo: {
            ...clientTheme.logo,
            // Override logo if specified in DB
            ...(clientSettings.logo && {
              imageUrl: clientSettings.logo,
            }),
            ...(clientSettings.login_logo && {
              loginImageUrl: clientSettings.login_logo,
            }),
          },
          // Override company name if specified
          ...(clientSettings.company_name && {
            companyName: clientSettings.company_name,
          }),
        };
        
        console.log('✅ Custom theme applied:', {
          primary_color: clientSettings.primary_color,
          logo: clientSettings.logo,
        });
      }
      
      setTheme(clientTheme);
      console.log('✅ Theme loaded successfully for client:', userData.client_id);

      setIsLoading(false);

    } catch (error) {
      console.error('❌ Error loading dynamic theme:', error);
      // Fallback to default
      const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
      setTheme(themes[defaultThemeName] || themes['dxc']);
      setIsLoading(false);
    }
  };

  // Load theme on mount
  useEffect(() => {
    loadUserTheme();
  }, []);

  // Listen for auth changes to reload theme
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('🎨 Auth state changed, reloading theme');
        loadUserTheme();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isLoading, reloadTheme: loadUserTheme }}>
      {children}
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

// Export aussi un getter statique pour compatibilité avec code existant
export function getCurrentTheme(): ThemeConfig {
  const themeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
  return themes[themeName] || themes['dxc'];
}

