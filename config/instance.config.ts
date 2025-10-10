export interface InstanceLimits {
  maxUsers: number;
  maxNotes: number;
  maxApiCallsPerHour: number;
  maxApiCallsPerDay: number;
  maxApiCallsPerMonth: number;
  maxStorageBytes: number;
  maxWebhooks: number;
  maxWebhooksPerUser: number;
  maxTemplates: number;
  maxTemplatesPerUser: number;
  maxNotesPerUser: number;
  maxApiKeys: number;
  maxApiKeysPerUser: number;
  rateLimitRequests: number; // requests per minute
  rateLimitWindow: number; // window in milliseconds
}

export interface InstanceConfig {
  instanceId: string;
  instanceName: string;
  plan: 'self_hosted' | 'basic' | 'pro' | 'enterprise' | 'custom';
  limits: InstanceLimits;
  features: {
    webhooksEnabled: boolean;
    templatesEnabled: boolean;
    sharingEnabled: boolean;
    apiKeysEnabled: boolean;
    customBrandingEnabled: boolean;
    advancedFeaturesEnabled: boolean;
  };
  branding?: {
    name: string;
    logo?: string;
    primaryColor?: string;
    customCss?: string;
  };
  adminContact?: {
    name: string;
    email: string;
  };
}

// Default configurations for different plans
export const DEFAULT_PLANS: Record<string, InstanceLimits> = {
  self_hosted: {
    maxUsers: -1, // unlimited
    maxNotes: -1,
    maxApiCallsPerHour: -1,
    maxApiCallsPerDay: -1,
    maxApiCallsPerMonth: -1,
    maxStorageBytes: -1,
    maxWebhooks: -1,
    maxWebhooksPerUser: -1,
    maxTemplates: -1,
    maxTemplatesPerUser: -1,
    maxNotesPerUser: -1,
    maxApiKeys: -1,
    maxApiKeysPerUser: -1,
    rateLimitRequests: 1000,
    rateLimitWindow: 60000, // 1 minute
  },
  basic: {
    maxUsers: 5,
    maxNotes: 1000,
    maxApiCallsPerHour: 1000,
    maxApiCallsPerDay: 10000,
    maxApiCallsPerMonth: 100000,
    maxStorageBytes: 1024 * 1024 * 1024, // 1GB
    maxWebhooks: 3,
    maxWebhooksPerUser: 2,
    maxTemplates: 50,
    maxTemplatesPerUser: 10,
    maxNotesPerUser: 200,
    maxApiKeys: 5,
    maxApiKeysPerUser: 1,
    rateLimitRequests: 100,
    rateLimitWindow: 60000,
  },
  pro: {
    maxUsers: 25,
    maxNotes: 10000,
    maxApiCallsPerHour: 5000,
    maxApiCallsPerDay: 50000,
    maxApiCallsPerMonth: 1000000,
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10GB
    maxWebhooks: 10,
    maxWebhooksPerUser: 5,
    maxTemplates: 200,
    maxTemplatesPerUser: 50,
    maxNotesPerUser: 1000,
    maxApiKeys: 25,
    maxApiKeysPerUser: 5,
    rateLimitRequests: 300,
    rateLimitWindow: 60000,
  },
  enterprise: {
    maxUsers: -1,
    maxNotes: -1,
    maxApiCallsPerHour: -1,
    maxApiCallsPerDay: -1,
    maxApiCallsPerMonth: -1,
    maxStorageBytes: -1,
    maxWebhooks: -1,
    maxWebhooksPerUser: -1,
    maxTemplates: -1,
    maxTemplatesPerUser: -1,
    maxNotesPerUser: -1,
    maxApiKeys: -1,
    maxApiKeysPerUser: -1,
    rateLimitRequests: 1000,
    rateLimitWindow: 60000,
  }
};

export class InstanceConfigManager {
  private static instance: InstanceConfigManager;
  private config!: InstanceConfig;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): InstanceConfigManager {
    if (!InstanceConfigManager.instance) {
      InstanceConfigManager.instance = new InstanceConfigManager();
    }
    return InstanceConfigManager.instance;
  }

  private loadConfig(): void {
    // Try to load from environment variable first (for deployed instances)
    const envConfig = process.env.INSTANCE_CONFIG;
    if (envConfig) {
      try {
        this.config = JSON.parse(envConfig);
        return;
      } catch (error) {
        console.warn('Failed to parse INSTANCE_CONFIG from environment variable');
      }
    }

    // Try to load from file
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'instance.config.json');
      
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(configFile);
        return;
      }
    } catch (error) {
      console.warn('Failed to load instance.config.json');
    }

    // Default to self-hosted configuration
    this.config = this.createDefaultConfig();
  }

  private createDefaultConfig(): InstanceConfig {
    return {
      instanceId: process.env.INSTANCE_ID || 'self-hosted',
      instanceName: process.env.INSTANCE_NAME || 'KeepIt Self-Hosted',
      plan: 'self_hosted',
      limits: DEFAULT_PLANS.self_hosted,
      features: {
        webhooksEnabled: true,
        templatesEnabled: true,
        sharingEnabled: true,
        apiKeysEnabled: true,
        customBrandingEnabled: true,
        advancedFeaturesEnabled: true,
      },
      branding: {
        name: 'KeepIt',
      },
      adminContact: {
        name: process.env.ADMIN_NAME || 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@localhost',
      }
    };
  }

  getConfig(): InstanceConfig {
    return this.config;
  }

  getLimits(): InstanceLimits {
    return this.config.limits;
  }

  isFeatureEnabled(feature: keyof InstanceConfig['features']): boolean {
    return this.config.features[feature];
  }

  isUnlimited(limit: keyof InstanceLimits): boolean {
    const value = this.config.limits[limit];
    return typeof value === 'number' && value === -1;
  }

  checkLimit(limit: keyof InstanceLimits, currentValue: number): boolean {
    const limitValue = this.config.limits[limit];
    if (typeof limitValue === 'number' && limitValue === -1) {
      return true; // unlimited
    }
    return typeof limitValue === 'number' ? currentValue < limitValue : true;
  }

  reloadConfig(): void {
    this.loadConfig();
  }
}