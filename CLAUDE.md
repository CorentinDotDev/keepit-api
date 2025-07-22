# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Express.js TypeScript API for a notes application with authentication, CRUD operations, and webhook support. Uses Prisma ORM for database operations.

## Development Commands

Since this project has no package.json, it appears to use direct TypeScript compilation or runtime tools like ts-node:

- Start server: `ts-node server.ts` or `node dist/server.js` (if compiled)
- Environment: Ensure `.env` file contains `JWT_SECRET`

## Architecture

### Core Structure
- **server.ts**: Express app setup with CORS, JSON middleware, and route mounting
- **Routes**: Modular routing with separate files for auth, notes, and webhooks
- **Controllers**: Business logic separated from routing
- **Middleware**: JWT authentication middleware
- **Database**: Prisma client for PostgreSQL/MySQL operations
- **Webhooks**: Automated webhook triggering on note events

### Key Patterns
- Controllers follow async/await pattern with try-catch error handling
- Authentication uses JWT tokens via Bearer header
- Database relationships: Users -> Notes -> Checkboxes, Users -> Webhooks
- Webhook system triggers on note_created, note_updated, note_deleted events

### Data Models
- **User**: email, password (hashed with bcrypt)
- **Note**: title, content, color, isPinned, isShared, checkboxes[], userId
- **Checkbox**: label, checked, noteId
- **Webhook**: url, action, userId

### Route Structure
- `/register` and `/login` → auth routes
- `/notes` → note CRUD operations (requires auth)
- `/webhooks` → webhook management (requires auth)

### Authentication Flow
1. Registration: bcrypt hash password, store user
2. Login: verify credentials, return JWT token
3. Protected routes: authenticate middleware validates JWT, adds user to req object

## Important Notes
- All note operations trigger corresponding webhooks automatically
- Error responses are in French
- JWT secret must be configured in environment
- Database schema managed through Prisma