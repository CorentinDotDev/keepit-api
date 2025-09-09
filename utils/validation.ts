import { VALIDATION_LIMITS } from "../constants";

export function isValidEmail(email: string): boolean {
  if (!email || email.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return Boolean(password && password.length >= VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
}

export function isValidTitle(title: string): boolean {
  return Boolean(title && title.trim().length > 0 && title.length <= VALIDATION_LIMITS.TITLE_MAX_LENGTH);
}

export function isValidContent(content: string): boolean {
  return content !== undefined && content.length <= VALIDATION_LIMITS.CONTENT_MAX_LENGTH;
}

export function isValidColor(color?: string): boolean {
  if (!color) return true;
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color);
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

export function sanitizeString(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '');
}

export function sanitizeHtml(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove on* event handlers
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    // Remove style attributes that might contain expressions
    .replace(/style\s*=\s*"[^"]*"/gi, '')
    .replace(/style\s*=\s*'[^']*'/gi, '');
}

export function sanitizeCheckboxes(checkboxes?: Array<{ id?: number; label: string; checked: boolean }>): Array<{ id?: number; label: string; checked: boolean }> | undefined {
  if (!checkboxes) return undefined;
  
  return checkboxes.map(checkbox => ({
    ...checkbox,
    label: sanitizeString(checkbox.label)
  }));
}