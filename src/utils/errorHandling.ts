export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
    return (error as any).message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
};