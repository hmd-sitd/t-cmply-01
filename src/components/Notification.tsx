// src/components/Notification.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../config/themes';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Notification({ type, message, duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const colors = {
    success: {
      bg: '#10b981',
      text: 'white',
      icon: '✓'
    },
    error: {
      bg: '#ef4444',
      text: 'white',
      icon: '✕'
    },
    warning: {
      bg: '#f59e0b',
      text: 'white',
      icon: '⚠'
    },
    info: {
      bg: currentTheme.colors.primary,
      text: 'white',
      icon: 'ℹ'
    }
  };

  const config = colors[type];

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: config.bg,
      color: config.text,
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
      zIndex: 10000,
      animation: isLeaving ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out',
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {config.icon}
      </div>
      <div style={{ flex: 1 }}>
        {message}
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: config.text,
          cursor: 'pointer',
          fontSize: '20px',
          opacity: 0.8,
          padding: 0
        }}
      >
        ×
      </button>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Hook for using notifications
export function useNotification() {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([]);

  const showNotification = (type: NotificationProps['type'], message: string, duration?: number) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationContainer = () => (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 80}px`,
            right: '20px',
            zIndex: 10000 + index
          }}
        >
          <Notification
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </>
  );

  return {
    showNotification,
    NotificationContainer
  };
}