export interface WebhookPayload {
  action: string;
  note?: any;
  userId: number;
  timestamp: string;
  [key: string]: any;
}

export interface RefreshTokenRecord {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  user: {
    id: number;
    email: string;
  };
}