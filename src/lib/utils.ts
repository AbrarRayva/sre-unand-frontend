import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getApiBaseUrl = (path: string = ''): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const rootUrl = baseUrl.replace('/api', '');
  // Ensure path starts with a slash if it's not empty
  const formattedPath = path && !path.startsWith('/') ? `/${path}` : path;
  return `${rootUrl}${formattedPath}`;
};
