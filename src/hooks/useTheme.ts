"use client"

import { currentTheme } from '../config/themes';

export const useTheme = () => {
  const getButtonStyles = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    const baseStyles = {
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      padding: '12px 24px',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.buttonPrimary,
          color: 'white',
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.buttonSecondary,
          color: currentTheme.colors.primary,
          border: `1px solid ${currentTheme.colors.buttonSecondary}`,
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.buttonDanger,
          color: 'white',
        };
      default:
        return baseStyles;
    }
  };

  const getHoverStyles = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: currentTheme.colors.buttonPrimaryHover,
          transform: 'translateY(-1px)',
        };
      case 'secondary':
        return {
          backgroundColor: currentTheme.colors.buttonSecondaryHover,
          color: 'white',
        };
      case 'danger':
        return {
          backgroundColor: currentTheme.colors.buttonDangerHover,
        };
      default:
        return {};
    }
  };

  return {
    theme: currentTheme,
    getButtonStyles,
    getHoverStyles,
  };
};