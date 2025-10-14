// src/utils/formatters.ts

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "Unknown date";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid date";
  }
};

export const getFileTypeFromName = (filename: string): string => {
  if (!filename || typeof filename !== "string") return "FILE";
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "DOC";
    case "txt":
      return "TXT";
    case "md":
      return "MD";
    case "html":
      return "HTML";
    default:
      return "FILE";
  }
};

export const getFileTypeColor = (filename: string): string => {
  if (!filename || typeof filename !== "string") return "#6b7280";
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "#5e249e";
    case "doc":
    case "docx":
      return "#3b82f6";
    case "txt":
      return "#10b981";
    case "md":
      return "#f59e0b";
    case "html":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};