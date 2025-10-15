// src/hooks/useDynamicTheme.ts - Dynamic theme based on user's client
"use client"

import { useState, useEffect } from 'react';
import { themes, type ThemeConfig } from '../config/themes';
import { supabase } from '../lib/supabase';

export function useDynamicTheme() {
  const [theme, setTheme] = useState<ThemeConfig>(themes['dxc']); // Default
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserTheme();
  }, []);

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

      // Get user data with client info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('client_id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData?.client_id) {
        // User without client (super admin?) or error
        const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
        setTheme(themes[defaultThemeName] || themes['dxc']);
        setIsLoading(false);
        return;
      }

      // Get client settings
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('settings')
        .eq('id', userData.client_id)
        .single();

      if (clientError || !clientData?.settings) {
        // No client settings, use default
        const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
        setTheme(themes[defaultThemeName] || themes['dxc']);
        setIsLoading(false);
        return;
      }

      // Load theme from client settings
      const clientSettings = clientData.settings as any;
      const themeName = clientSettings.theme || 'dxc';
      
      console.log('🎨 Loading theme for client:', userData.client_id, '→', themeName);
      
      setTheme(themes[themeName] || themes['dxc']);
      setIsLoading(false);

    } catch (error) {
      console.error('Error loading dynamic theme:', error);
      // Fallback to default
      const defaultThemeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
      setTheme(themes[defaultThemeName] || themes['dxc']);
      setIsLoading(false);
    }
  };

  return {
    theme,
    isLoading,
    reload: loadUserTheme
  };
}

