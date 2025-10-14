"use client"

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface UserProfileProps {
  onLogout: () => void;
}

export default function UserProfile({ onLogout }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

const handleLogout = async () => {
  try {
    await logout();  // This is from useAuth hook
    onLogout();      // This is the callback prop
    setDropdownOpen(false);
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#374151',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #5F249F 0%, #5F249F 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '14px',
        }}>
          {user.email[0].toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: '500', fontSize: '14px' }}>
            {user.email.split('@')[0]}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {user.email.split('@')[1]}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          minWidth: '220px',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#f9fafb',
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Signed in as
            </div>
            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
              {user.email}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Active since {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div style={{ padding: '8px 0' }}>
            <button
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile Settings
            </button>
            
            <button
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6" />
                <path d="m15.5 3.5-1 1m-5 5-1 1m-5 5-1 1" />
                <path d="m20.5 8.5-1-1m-5 5-1-1m-5 5-1-1" />
                <path d="M1 12h6m6 0h6" />
              </svg>
              Preferences
            </button>
          </div>
          
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 0' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}