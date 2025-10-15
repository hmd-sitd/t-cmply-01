"use client"

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalProjects: number;
  totalRoles: number;
  totalPermissions: number;
  vectorStats?: {
    total_objects: number;
    total_vectors: number;
    collection_name: string;
    dimension: number;
  };
}

interface SystemStatsProps {
  stats: SystemStats;
  isLoading: boolean;
  onRefresh: () => void;
}

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

export default function SystemStats({ stats, isLoading, onRefresh }: SystemStatsProps) {
  const { theme } = useTheme();
  
  const statItems = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: UsersIcon,
      color: theme.colors.primary,
    },
    {
      title: "Total Files",
      value: stats.totalFiles,
      subtitle: "Documents uploaded",
      icon: FileIcon,
      color: "#10b981",
    },
    {
      title: "Projects",
      value: stats.totalProjects,
      subtitle: "Active workspaces",
      icon: FolderIcon,
      color: "#f59e0b",
    },
    {
      title: "Roles",
      value: stats.totalRoles,
      subtitle: "Permission groups",
      icon: DatabaseIcon,
      color: "#ef4444",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
      }}>
        <div>
          <h2 style={{
            fontSize: "28px",
            fontWeight: "600",
            color: theme.colors.textDark,
            margin: "0 0 8px 0",
          }}>
            System Overview
          </h2>
          <p style={{
            fontSize: "16px",
            color: theme.colors.textMedium,
            margin: 0,
          }}>
            Current system statistics and health metrics
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            padding: "12px 20px",
            backgroundColor: "transparent",
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: "8px",
            color: theme.colors.textMedium,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = theme.colors.backgroundAlt;
              e.currentTarget.style.borderColor = theme.colors.inputBorderFocus;
              e.currentTarget.style.color = theme.colors.textDark;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = theme.colors.inputBorder;
              e.currentTarget.style.color = theme.colors.textMedium;
            }
          }}
        >
          <RefreshIcon />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "40px",
      }}>
        {statItems.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.grayLight}`,
                borderRadius: "12px",
                padding: "24px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.borderColor = theme.colors.inputBorderFocus;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = theme.colors.grayLight;
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}>
                <div>
                  <div style={{
                    fontSize: "14px",
                    color: theme.colors.textMedium,
                    fontWeight: "500",
                    marginBottom: "8px",
                  }}>
                    {stat.title}
                  </div>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: theme.colors.textDark,
                    marginBottom: "4px",
                  }}>
                    {isLoading ? "..." : stat.value.toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: theme.colors.textLight,
                  }}>
                    {stat.subtitle}
                  </div>
                </div>

                <div style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: `${stat.color}20`,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: stat.color,
                }}>
                  <IconComponent />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vector Database Stats */}
      {stats.vectorStats && (
        <div style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.grayLight}`,
          borderRadius: "12px",
          padding: "32px",
        }}>
          <h3 style={{
            fontSize: "20px",
            fontWeight: "600",
            color: theme.colors.textDark,
            margin: "0 0 24px 0",
          }}>
            Vector Database Status
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}>
            <div>
              <div style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
                fontWeight: "500",
                marginBottom: "8px",
              }}>
                Total Objects
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: theme.colors.textDark,
              }}>
                {stats.vectorStats.total_objects.toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
                fontWeight: "500",
                marginBottom: "8px",
              }}>
                Total Vectors
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: theme.colors.textDark,
              }}>
                {stats.vectorStats.total_vectors.toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
                fontWeight: "500",
                marginBottom: "8px",
              }}>
                Collection
              </div>
              <div style={{
                fontSize: "16px",
                fontWeight: "500",
                color: theme.colors.textDark,
                fontFamily: "monospace",
              }}>
                {stats.vectorStats.collection_name}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
                fontWeight: "500",
                marginBottom: "8px",
              }}>
                Dimension
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: theme.colors.textDark,
              }}>
                {stats.vectorStats.dimension}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Overview */}
      <div style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.grayLight}`,
        borderRadius: "12px",
        padding: "32px",
        marginTop: "24px",
      }}>
        <h3 style={{
          fontSize: "20px",
          fontWeight: "600",
          color: theme.colors.textDark,
          margin: "0 0 16px 0",
        }}>
          RBAC Overview
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
        }}>
          <div>
            <div style={{
              fontSize: "14px",
              color: theme.colors.textMedium,
              fontWeight: "500",
              marginBottom: "8px",
            }}>
              Total Permissions
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: theme.colors.primary,
              marginBottom: "8px",
            }}>
              {stats.totalPermissions}
            </div>
            <div style={{
              fontSize: "12px",
              color: theme.colors.textLight,
            }}>
              System-wide permissions configured
            </div>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: theme.colors.backgroundAlt,
            borderRadius: "8px",
          }}>
            <div style={{
              fontSize: "14px",
              color: theme.colors.textMedium,
              fontWeight: "500",
              marginBottom: "12px",
            }}>
              System Status
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: theme.colors.success,
              }} />
              <span style={{
                fontSize: "16px",
                fontWeight: "600",
                color: theme.colors.success,
              }}>
                Operational
              </span>
            </div>
            <div style={{
              fontSize: "12px",
              color: theme.colors.textLight,
              marginTop: "4px",
            }}>
              All services running normally
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}