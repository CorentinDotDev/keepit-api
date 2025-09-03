declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        email: string;
      };
      apiKey?: {
        id: number;
        permissions: string[];
      };
    }
  }
}

export {};