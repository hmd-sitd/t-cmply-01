import React, { useState, useEffect } from 'react';
import { currentTheme } from '../config/themes';
import type { ChatSettings } from '../types/index'; 
import { DEFAULT_SETTINGS } from '../utils/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ChatSettings) => void;
  currentSettings: ChatSettings;
  availableModels?: string[]; 
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings, 
  availableModels = [] 
}: SettingsModalProps) {
  const [settings, setSettings] = useState<ChatSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const updateSetting = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            AI Assistant Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Settings Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Model Selection - NEW SECTION */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              AI Model
            </label>
            <select
              value={settings.model_name}
              onChange={(e) => {
                updateSetting('model_name', e.target.value);
                const model = e.target.value;
                if (model.includes('gpt') || model.includes('openai')) {
                  updateSetting('model_provider', 'openai');
                } else if (model.includes('claude') || model.includes('anthropic')) {
                  updateSetting('model_provider', 'anthropic');
                } else {
                  updateSetting('model_provider', 'groq');
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                color: '#000000',
              }}
            >
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                <>
                  <option value="moonshotai/kimi-k2-instruct">Moonshot Kimi (Groq)</option>
                  <option value="llama3.1-8b-instruct">Llama 3.1 8B (Groq)</option>
                  <option value="llama3.1-70b-instruct">Llama 3.1 70B (Groq)</option>
                  <option value="gpt-4">GPT-4 (OpenAI)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet (Anthropic)</option>
                </>
              )}
            </select>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Selected provider: {settings.model_provider}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Model Provider
            </label>
            <select
              value={settings.model_provider}
              onChange={(e) => updateSetting('model_provider', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                color: '#000000',
              }}
            >
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>


          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Temperature: {settings.temperature}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '30px' }}>0.0</span>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${settings.temperature * 100}%, #e5e7eb ${settings.temperature * 100}%, #e5e7eb 100%)`,
                    outline: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '30px' }}>1.0</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Max Tokens: {settings.max_tokens}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '30px' }}>100</span>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.max_tokens}
                  onChange={(e) => updateSetting('max_tokens', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((settings.max_tokens - 100) / 3900) * 100}%, #e5e7eb ${((settings.max_tokens - 100) / 3900) * 100}%, #e5e7eb 100%)`,
                    outline: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '40px' }}>4000</span>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              System Prompt
            </label>
            <textarea
              value={settings.system_prompt}
              onChange={(e) => updateSetting('system_prompt', e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f9fafb',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                color: '#000000',
              }}
              placeholder="Enter your custom system prompt..."
            />
          </div>

          {/* Memory and other settings remain the same... */}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Reset to Defaults
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                backgroundColor: '#8b5cf6',
                border: '1px solid #8b5cf6',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}