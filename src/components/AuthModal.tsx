// src/components/AuthModal.tsx - DEBUG VERSION
"use client"

import type React from "react"
import { useState } from "react"
import { apiService } from "../services/api"
import { useTheme } from '../contexts/ThemeContext';

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("") 
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      if (isLogin) {
        console.log('🔐 Attempting login for:', email)
        const response = await apiService.login({ email, password })
        console.log('✅ Login successful:', response)
        setSuccessMessage("Login successful! Redirecting...")
        
        // Wait a bit before closing to show success message
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      } else {
        console.log('📝 Attempting registration for:', email)
        const response = await apiService.register({ email, password })
        console.log('✅ Registration successful:', response)
        setSuccessMessage("Registration successful! You can now login.")
        
        // Switch to login after successful registration
        setTimeout(() => {
          setIsLogin(true)
          setPassword("")
          setSuccessMessage("Please login with your new account")
        }, 2000)
      }

    } catch (error: any) {
      console.error('❌ Auth error:', error)
      
      // More specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        setError("Invalid email or password. If you just registered, please wait a moment and try again.")
      } else if (error.message?.includes('User already registered')) {
        setError("This email is already registered. Please login instead.")
      } else if (error.message?.includes('User account not found')) {
        setError("Account not found. Please register first or check your email.")
      } else {
        setError(error.message || "Authentication failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOLogin = () => {
    console.log("SSO login initiated")
  }

  const handleForgotPassword = () => {
    console.log("Forgot password clicked")
  }

  const handleContactAdmin = () => {
    console.log("Contact administrator clicked")
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.modalOverlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.modalBackground,
          borderRadius: "12px",
          padding: "48px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: theme.colors.textMedium,
            padding: "4px",
          }}
        >
          ×
        </button>

        {/* Logo Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          {theme.logo.loginImageUrl ? (
            <img 
              src={theme.logo.loginImageUrl}
              alt={`${theme.companyName} Logo`}
              style={{
                height: "80px",
                maxWidth: "320px",
                objectFit: "contain"
              }}
            />
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "32px",
                fontWeight: "bold",
                color: theme.colors.primary,
              }}
            >
              <div
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "36px",
                  fontWeight: "800",
                  letterSpacing: "-1px",
                }}
              >
                {theme.logo.text}
              </div>
              <div
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "36px",
                  fontWeight: "300",
                  letterSpacing: "2px",
                }}
              >
                {theme.logo.subText}
              </div>
            </div>
          )}
        </div>

        {/* Auth Toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: theme.colors.backgroundAlt,
            borderRadius: "8px",
            padding: "4px",
            marginBottom: "32px",
          }}
        >
          <button
            onClick={() => {
              setIsLogin(true)
              setError("")
              setSuccessMessage("")
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isLogin ? theme.colors.primary : "transparent",
              color: isLogin ? "white" : theme.colors.textMedium,
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false)
              setError("")
              setSuccessMessage("")
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: !isLogin ? theme.colors.primary : "transparent",
              color: !isLogin ? "white" : theme.colors.textMedium,
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: theme.colors.textDark,
                marginBottom: "8px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${theme.colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "16px",
                outline: "none",
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.textDark,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: theme.colors.textDark,
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 48px 12px 16px",
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.textDark,
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: theme.colors.textLight,
                  padding: "4px",
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#10b98120",
                border: "1px solid #10b981",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                color: "#059669",
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: `${theme.colors.error}20`,
                border: `1px solid ${theme.colors.error}`,
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                color: theme.colors.error,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 24px",
              backgroundColor: isLoading ? theme.colors.textLight : theme.colors.buttonPrimary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s, transform 0.1s",
              marginBottom: "24px",
            }}
          >
            {isLoading ? (isLogin ? "Signing In..." : "Signing Up...") : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        {/* Debug Info (REMOVE IN PRODUCTION) */}
        <div style={{ 
          marginTop: "20px", 
          padding: "12px", 
          backgroundColor: "#f3f4f6", 
          borderRadius: "8px",
          fontSize: "12px",
          color: "#6b7280"
        }}>
        </div>
      </div>
    </div>
  )
} 