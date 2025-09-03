import swaggerJsdoc from 'swagger-jsdoc';
import { VALIDATION_LIMITS } from './constants';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: `API Express.js TypeScript pour une application de notes avec authentification JWT, clés API et webhooks.

## Authentification

Cette API supporte deux types d'authentification :

### 1. Authentification JWT (Bearer Token)
- Utilisez l'en-tête \`Authorization: Bearer <token>\`
- Accès complet à tous les endpoints (notes, webhooks, gestion des clés API)
- Obtenu via les endpoints de connexion (/auth/login)

### 2. Authentification par Clé API (X-API-Key)
- Utilisez l'en-tête \`X-API-Key: <clé>\`
- Accès limité aux opérations sur les notes selon les permissions accordées
- **Les webhooks ne sont PAS accessibles via les clés API**
- Permissions disponibles :
  - \`read_notes\`: Lire les notes
  - \`create_notes\`: Créer des notes
  - \`update_notes\`: Modifier les notes
  - \`delete_notes\`: Supprimer les notes
  - \`share_notes\`: Partager les notes

### Opérations réservées au JWT uniquement :
- Gestion des webhooks
- Notes partagées (shared, unshare, leave)
- Gestion des clés API (création, liste, suppression)

## Permissions des Clés API

Les clés API permettent un contrôle granulaire des permissions :
- Une clé peut avoir une ou plusieurs permissions
- Les permissions sont vérifiées à chaque requête
- Les clés peuvent avoir une date d'expiration optionnelle`,
      contact: {
        name: 'API Support',
        email: 'support@notes-api.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur',
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: VALIDATION_LIMITS.EMAIL_MAX_LENGTH,
              description: 'Email de l\'utilisateur',
            },
          },
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de la note',
            },
            title: {
              type: 'string',
              maxLength: VALIDATION_LIMITS.TITLE_MAX_LENGTH,
              description: 'Titre de la note',
            },
            content: {
              type: 'string',
              maxLength: VALIDATION_LIMITS.CONTENT_MAX_LENGTH,
              description: 'Contenu de la note',
            },
            color: {
              type: 'string',
              description: 'Couleur de la note (format hex)',
              nullable: true,
            },
            isPinned: {
              type: 'boolean',
              description: 'Indique si la note est épinglée',
              default: false,
            },
            isShared: {
              type: 'boolean',
              description: 'Indique si la note est partagée',
              default: false,
            },
            userId: {
              type: 'integer',
              description: 'ID de l\'utilisateur propriétaire',
            },
            checkboxes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Checkbox',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière modification',
            },
          },
        },
        Checkbox: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de la checkbox',
            },
            label: {
              type: 'string',
              description: 'Texte de la checkbox',
            },
            checked: {
              type: 'boolean',
              description: 'État de la checkbox',
              default: false,
            },
            noteId: {
              type: 'integer',
              description: 'ID de la note parente',
            },
          },
        },
        Webhook: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique du webhook',
            },
            action: {
              type: 'string',
              enum: ['note_created', 'note_updated', 'note_deleted'],
              description: 'Action déclenchant le webhook',
              nullable: true,
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL du webhook',
              nullable: true,
            },
            userId: {
              type: 'integer',
              description: 'ID de l\'utilisateur propriétaire',
            },
          },
        },
        AuthRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              maxLength: VALIDATION_LIMITS.EMAIL_MAX_LENGTH,
              description: 'Email de l\'utilisateur',
            },
            password: {
              type: 'string',
              minLength: VALIDATION_LIMITS.PASSWORD_MIN_LENGTH,
              description: 'Mot de passe de l\'utilisateur',
            },
          },
        },
        NoteRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: {
              type: 'string',
              maxLength: VALIDATION_LIMITS.TITLE_MAX_LENGTH,
              description: 'Titre de la note',
            },
            content: {
              type: 'string',
              maxLength: VALIDATION_LIMITS.CONTENT_MAX_LENGTH,
              description: 'Contenu de la note',
            },
            color: {
              type: 'string',
              description: 'Couleur de la note',
            },
            isPinned: {
              type: 'boolean',
              description: 'Note épinglée',
            },
            checkboxes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  checked: { type: 'boolean' },
                },
              },
            },
          },
        },
        NoteUpdateRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: VALIDATION_LIMITS.TITLE_MAX_LENGTH,
              description: 'Titre de la note',
            },
            content: {
              type: 'string',
              maxLength: VALIDATION_LIMITS.CONTENT_MAX_LENGTH,
              description: 'Contenu de la note',
            },
            color: {
              type: 'string',
              description: 'Couleur de la note',
            },
            isPinned: {
              type: 'boolean',
              description: 'Note épinglée',
            },
            isShared: {
              type: 'boolean',
              description: 'Note partagée',
            },
            checkboxes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', description: 'ID de la checkbox (optionnel pour nouvelles checkboxes)' },
                  label: { type: 'string', description: 'Texte de la checkbox' },
                  checked: { type: 'boolean', description: 'État de la checkbox' },
                },
                required: ['label', 'checked'],
              },
              description: 'Liste des checkboxes (remplace complètement la liste existante)',
            },
          },
        },
        WebhookRequest: {
          type: 'object',
          required: ['action', 'url'],
          properties: {
            action: {
              type: 'string',
              enum: ['note_created', 'note_updated', 'note_deleted'],
              description: 'Action déclenchant le webhook. Valeurs possibles: note_created, note_updated, note_deleted',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL du webhook (HTTPS recommandé). Ne peut pas être une URL interne (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x)',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message de succès',
            },
          },
        },
        Token: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token JWT d\'authentification',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'Token JWT d\'accès',
            },
            refreshToken: {
              type: 'string',
              description: 'Token de rafraîchissement',
            },
            expiresIn: {
              type: 'string',
              description: 'Durée de validité du token d\'accès',
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Token de rafraîchissement',
            },
          },
        },
        WebhookPayload: {
          type: 'object',
          description: 'Payload envoyé au webhook lors du déclenchement',
          properties: {
            action: {
              type: 'string',
              enum: ['note_created', 'note_updated', 'note_deleted'],
              description: 'Action qui a déclenché le webhook',
            },
            note: {
              $ref: '#/components/schemas/Note',
              description: 'Données de la note concernée',
            },
            userId: {
              type: 'integer',
              description: 'ID de l\'utilisateur propriétaire',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Horodatage de l\'événement',
            },
          },
          example: {
            action: 'note_created',
            note: {
              id: 1,
              title: 'Ma nouvelle note',
              content: 'Contenu de la note',
              color: '#ffffff',
              isPinned: false,
              isShared: false,
              userId: 1,
              checkboxes: [],
              createdAt: '2023-12-01T10:00:00.000Z',
              updatedAt: '2023-12-01T10:00:00.000Z'
            },
            userId: 1,
            timestamp: '2023-12-01T10:00:00.000Z'
          }
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de la clé API',
            },
            name: {
              type: 'string',
              description: 'Nom descriptif de la clé API',
            },
            key: {
              type: 'string',
              description: 'Clé API (tronquée pour sécurité)',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['create_notes', 'read_notes', 'update_notes', 'delete_notes', 'share_notes'],
              },
              description: 'Liste des permissions accordées',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Date d\'expiration (null = pas d\'expiration)',
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Date de dernière utilisation',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
          },
        },
        ApiKeyRequest: {
          type: 'object',
          required: ['name', 'permissions'],
          properties: {
            name: {
              type: 'string',
              description: 'Nom descriptif de la clé API',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['create_notes', 'read_notes', 'update_notes', 'delete_notes', 'share_notes'],
              },
              minItems: 1,
              description: 'Liste des permissions à accorder',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date d\'expiration optionnelle',
            },
          },
        },
        ApiKeyResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message de succès',
            },
            apiKey: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  description: 'ID unique de la clé API',
                },
                name: {
                  type: 'string',
                  description: 'Nom descriptif de la clé API',
                },
                key: {
                  type: 'string',
                  description: 'Clé API complète (visible uniquement à la création)',
                },
                permissions: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'Liste des permissions accordées',
                },
                expiresAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'Date d\'expiration',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Date de création',
                },
              },
            },
          },
        },
        ApiKeyListResponse: {
          type: 'object',
          properties: {
            apiKeys: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ApiKey',
              },
              description: 'Liste des clés API (clés tronquées)',
            },
          },
        },
        PermissionItem: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Clé de la permission',
            },
            label: {
              type: 'string',
              description: 'Libellé lisible de la permission',
            },
          },
        },
        PermissionsResponse: {
          type: 'object',
          properties: {
            permissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PermissionItem',
              },
              description: 'Liste des permissions disponibles',
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.ts'],
};

export const specs = swaggerJsdoc(options);