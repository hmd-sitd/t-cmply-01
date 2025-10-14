// src/hooks/useChatSettings.ts
import { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '../utils/constants';
import type { ChatSettings } from '../types';

export function useChatSettings() {
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai_assistant_chat_settings');
      if (stored) {
        try {
          const parsedSettings = JSON.parse(stored);
          setChatSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        } catch (error) {
          console.error('Failed to parse stored settings:', error);
        }
      }
    }
  }, []);

  const saveSettings = (newSettings: ChatSettings) => {
    setChatSettings(newSettings);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_assistant_chat_settings', JSON.stringify(newSettings));
    }
  };

  return {
    chatSettings,
    saveSettings
  };
}