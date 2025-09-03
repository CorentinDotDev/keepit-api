// Webhook actions
export const WEBHOOK_ACTIONS = {
  NOTE_CREATED: "note_created",
  NOTE_UPDATED: "note_updated",
  NOTE_DELETED: "note_deleted",
} as const;

export const VALID_WEBHOOK_ACTIONS = Object.values(WEBHOOK_ACTIONS);

// Validation limits
export const VALIDATION_LIMITS = {
  PASSWORD_MIN_LENGTH: 6,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 10000,
  EMAIL_MAX_LENGTH: 255,
} as const;

// Security settings
export const SECURITY_CONFIG = {
  WEBHOOK_TIMEOUT_MS: 5000,
  WEBHOOK_RATE_LIMIT_MS: 1000,
  JWT_EXPIRATION: "1m",
  REFRESH_TOKEN_EXPIRATION_DAYS: 30,
} as const;

// HTTP Status codes commonly used
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Auth errors
  EMAIL_PASSWORD_REQUIRED: "Email et mot de passe requis",
  INVALID_EMAIL: "Email invalide",
  PASSWORD_TOO_SHORT: "Mot de passe trop court (minimum 6 caractères)",
  EMAIL_ALREADY_USED: "Email déjà utilisé",
  USER_NOT_FOUND: "Utilisateur non trouvé",
  INVALID_PASSWORD: "Mot de passe invalide",
  MISSING_TOKEN: "Token manquant",
  INVALID_TOKEN: "Token invalide",
  REFRESH_TOKEN_REQUIRED: "Refresh token requis",
  INVALID_REFRESH_TOKEN: "Refresh token invalide ou expiré",
  SERVER_CONFIG_ERROR: "Configuration serveur invalide",

  // Note errors
  NOTE_NOT_FOUND: "Note non trouvée",
  ACCESS_DENIED: "Accès non autorisé",
  INVALID_TITLE: "Titre invalide (1-200 caractères)",
  CONTENT_TOO_LONG: "Contenu trop long (max 10000 caractères)",
  INVALID_COLOR: "Couleur invalide",
  CREATION_ERROR: "Erreur lors de la création",
  UPDATE_ERROR: "Erreur mise à jour",
  DELETE_ERROR: "Erreur suppression",
  CHECKBOX_NOT_FOUND: "Checkbox non trouvée",
  CHECKBOX_UPDATE_ERROR: "Erreur mise à jour checkbox",

  // Webhook errors
  ACTION_URL_REQUIRED: "Action et URL requis",
  INVALID_ACTION: "Action invalide",
  INVALID_URL: "URL invalide",
  INTERNAL_URL_FORBIDDEN: "URL interne non autorisée",
  WEBHOOK_CREATION_ERROR: "Erreur création webhook",
  WEBHOOK_NOT_FOUND: "Webhook non trouvé",

  // Sharing errors
  EMAILS_REQUIRED: "Liste d'emails requise",
  SHARE_ERROR: "Erreur lors du partage",
  FETCH_SHARED_ERROR: "Erreur lors de la récupération des notes partagées",
  UNSHARE_ERROR: "Erreur lors du retrait du partage",
  LEAVE_SHARED_ERROR: "Erreur lors de la sortie du partage",
  NOT_SHARED_WITH_USER: "Cette note n'est pas partagée avec vous",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: "Inscription réussie",
  NOTE_DELETED: "Supprimé",
  WEBHOOK_DELETED: "Webhook supprimé",
  NOTE_SHARED: "Note partagée avec succès",
  NOTE_UNSHARED: "Partage retiré avec succès",
  NOTE_UNSHARED_FROM_EMAIL: "Partage retiré pour cet email",
  LEFT_SHARED_NOTE: "Vous avez quitté le partage de cette note",
} as const;

// Blocked internal networks for SSRF protection
export const BLOCKED_NETWORKS = [
  "localhost",
  "127.0.0.1",
  "192.168.",
  "10.0.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
] as const;
