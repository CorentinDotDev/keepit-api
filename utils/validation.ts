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
    // Supprimer seulement les caractères dangereux qui pourraient casser l'API
    // Garder le contenu utilisateur intact
    .replace(/\0/g, '') // Null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Caractères de contrôle dangereux
}

export function sanitizeName(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    // Pour les noms (API keys, etc.) - plus strict
    .replace(/[<>]/g, '') // Pas de chevrons
    .replace(/["\\']/g, '') // Pas de quotes
    .replace(/\0/g, '') // Null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Caractères de contrôle
}

export function sanitizeMessage(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    // Pour les messages courts - enlever seulement le dangereux
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function sanitizeCheckboxes(checkboxes?: Array<{ id?: number; label: string; checked: boolean }>): Array<{ id?: number; label: string; checked: boolean }> | undefined {
  if (!checkboxes) return undefined;
  
  return checkboxes.map(checkbox => ({
    ...checkbox,
    label: sanitizeMessage(checkbox.label) // Les labels peuvent contenir du texte riche
  }));
}