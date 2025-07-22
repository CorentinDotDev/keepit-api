import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: 'API Express.js TypeScript pour une application de notes avec authentification et webhooks',
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
              description: 'Titre de la note',
            },
            content: {
              type: 'string',
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
              description: 'Email de l\'utilisateur',
            },
            password: {
              type: 'string',
              minLength: 6,
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
              description: 'Titre de la note',
            },
            content: {
              type: 'string',
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
        WebhookRequest: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['note_created', 'note_updated', 'note_deleted'],
              description: 'Action déclenchant le webhook',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL du webhook',
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
      },
    },
  },
  apis: ['./routes/*.ts'],
};

export const specs = swaggerJsdoc(options);