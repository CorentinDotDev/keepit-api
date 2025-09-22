declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role?: string;
      };
      apiKey?: {
        id: number;
        userId?: number;
        key?: string;
        name?: string;
        permissions: any;
      };
    }
  }
}

export {};