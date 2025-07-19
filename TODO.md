# TODO: lab.ozenc.dev Implementation

## Project Overview
A PNPM monorepo hosting platform for experimental web applications with a central manifest system, backend routing, and individual project serving.

## Phase 1: Project Structure & Foundation

### 1.1 Initialize Project Structure
- [x] Set up PNPM workspace configuration (`pnpm-workspace.yaml`)
- [ ] Create root `package.json` with workspace dependencies
- [ ] Set up TypeScript configuration at root level
- [ ] Create basic `.gitignore` for the monorepo
- [ ] Set up ESLint and Prettier configurations (optional)

### 1.2 Directory Structure
```
lab.ozenc.dev/
├── apps/
│   ├── hub/                 # Main React app (root "/")
│   ├── project-1/           # Example project
│   └── project-2/           # Example project
├── server/                  # Backend routing server
├── shared/                  # Shared utilities/types
├── manifest.json            # Central project registry
└── scripts/                 # Build/deployment scripts
```

### 1.3 Shared Types & Utilities
- [ ] Create `shared/types/` for TypeScript interfaces
- [ ] Define `ProjectManifest` interface with required fields:
  - `slug: string` (unique)
  - `name: string` 
  - `directory: string` (unique)
  - `description?: string`
  - `version?: string`
  - `entryPoint: string` (default: "index.html")
- [ ] Create manifest validation utilities
- [ ] Create shared build utilities

## Phase 2: Manifest System

### 2.1 Manifest Structure & Validation
- [ ] Create `manifest.json` in root directory
- [ ] Implement manifest validation script:
  - [ ] Check for duplicate slugs
  - [ ] Check for duplicate directories
  - [ ] Verify directory exists and contains entry point
  - [ ] Validate required fields
- [ ] Add manifest validation to pre-commit hooks

### 2.2 Manifest Management Scripts
- [ ] Create `scripts/add-project.js` - Add new project to manifest
- [ ] Create `scripts/remove-project.js` - Remove project from manifest
- [ ] Create `scripts/validate-manifest.js` - Validate manifest integrity
- [ ] Create `scripts/sync-manifest.js` - Auto-discover projects (optional)

## Phase 3: Backend Server

### 3.1 Server Setup
- [ ] Initialize Express.js server in `server/` directory
- [ ] Set up TypeScript configuration for server
- [ ] Create basic routing structure
- [ ] Set up static file serving for built projects

### 3.2 Core Routing Logic
- [ ] Implement manifest reading and caching
- [ ] Create dynamic route handler for project slugs:
  - [ ] Route `/:slug` to appropriate project directory
  - [ ] Serve project's built `dist/` or `build/` folder
  - [ ] Handle 404s for non-existent projects
- [ ] Implement root route (`/`) to serve hub app
- [ ] Add health check endpoint (`/api/health`)

### 3.3 API Endpoints
- [ ] `GET /api/projects` - List all projects from manifest
- [ ] `GET /api/projects/:slug` - Get specific project info
- [ ] `POST /api/projects/validate` - Validate manifest (dev only)

### 3.4 Development Server
- [ ] Create development mode with hot reloading
- [ ] Proxy setup for local development of individual projects
- [ ] Environment configuration (dev/prod)

## Phase 4: Hub Application (Main React App)

### 4.1 Hub App Setup
- [ ] Initialize Vite React TypeScript project in `apps/hub/`
- [ ] Configure build output to be served at root route
- [ ] Set up basic routing (if needed for hub features)
- [ ] Configure API integration with backend

### 4.2 Core Components
- [ ] `ProjectList` - Display all projects from API
- [ ] `ProjectCard` - Individual project preview card
- [ ] `Navigation` - Simple navigation (optional)
- [ ] `ErrorBoundary` - Handle errors gracefully

### 4.3 Project Discovery & Navigation
- [ ] Fetch projects from `/api/projects` endpoint
- [ ] Display project cards with:
  - [ ] Project name
  - [ ] Description (if available)
  - [ ] Link to project (`/slug`)
- [ ] Handle loading and error states
- [ ] Implement search/filter functionality (optional)

## Phase 5: Build System

### 5.1 Individual Project Build Configuration
- [ ] Ensure each project has `package.json` with required scripts:
  - [ ] `"build"` - Production build
  - [ ] `"dev"` - Development server
- [ ] Configure build output directories (`dist/` or `build/`)
- [ ] Ensure entry points are correctly generated

### 5.2 Global Build Pipeline
- [ ] Create `scripts/build-all.js` - Build all projects
- [ ] Create `scripts/build-project.js` - Build specific project
- [ ] Implement parallel building for better performance
- [ ] Add build validation (check for entry points)

### 5.3 Development Workflow
- [ ] `scripts/dev.js` - Start development environment
- [ ] Hot reloading setup for hub app
- [ ] Proxy configuration for project development
- [ ] Concurrent development server management

## Phase 6: Deployment & Hosting

### 6.1 Hosting Platform Research & Setup
- [ ] Research backend-supporting platforms:
  - [ ] Railway (Node.js friendly, free tier)
  - [ ] Render (free tier with backend support)
  - [ ] Heroku (if free tier available)
  - [ ] DigitalOcean App Platform
  - [ ] AWS Lightsail (minimal cost)
- [ ] Choose platform and create account
- [ ] Set up deployment configuration

### 6.2 Production Build Configuration
- [ ] Configure production environment variables
- [ ] Set up production build scripts
- [ ] Configure static file serving for production
- [ ] Implement proper error handling and logging

### 6.3 CI/CD Pipeline
- [ ] Set up GitHub Actions workflow:
  - [ ] Validate manifest on PR
  - [ ] Build all projects
  - [ ] Run tests (if any)
  - [ ] Deploy to hosting platform
- [ ] Configure automatic deployments on main branch

## Phase 7: Documentation & Examples

### 7.1 Documentation
- [ ] Update main `README.md` with:
  - [ ] Setup instructions
  - [ ] Development workflow
  - [ ] How to add new projects
  - [ ] Deployment instructions
- [ ] Create `CONTRIBUTING.md` with project guidelines
- [ ] Document manifest schema and validation rules

### 7.2 Example Projects
- [ ] Create 2-3 example projects with different tech stacks:
  - [ ] Simple vanilla JavaScript project
  - [ ] React project with Vite
  - [ ] Vue project (optional)
- [ ] Ensure all examples follow the required structure
- [ ] Add them to manifest

## Phase 8: Testing & Quality Assurance

### 8.1 Testing Setup
- [ ] Set up unit tests for manifest validation
- [ ] Set up integration tests for server routing
- [ ] Test hub app functionality
- [ ] Test build pipeline for various project types

### 8.2 Error Handling & Edge Cases
- [ ] Handle missing projects gracefully
- [ ] Implement proper 404 pages
- [ ] Handle build failures
- [ ] Validate manifest on server startup

## Phase 9: Optimization & Polish

### 9.1 Performance
- [ ] Implement caching for manifest reading
- [ ] Optimize static file serving
- [ ] Add compression for production
- [ ] Monitor build times and optimize

### 9.2 Developer Experience
- [ ] Add helpful CLI commands
- [ ] Improve error messages
- [ ] Add development utilities
- [ ] Create project templates (optional)

## Implementation Priority

**High Priority (MVP):**
- Phases 1-4: Core functionality
- Basic deployment (Phase 6.1-6.2)

**Medium Priority:**
- Phase 5: Build system optimization
- Phase 7: Documentation
- Phase 6.3: CI/CD

**Low Priority (Nice to have):**
- Phase 8: Comprehensive testing
- Phase 9: Optimization
- Advanced features

## Technical Decisions to Make

1. **Server Framework**: Express.js vs Fastify vs Koa
2. **Hosting Platform**: Railway vs Render vs others
3. **Build Tool Strategy**: Unified vs per-project
4. **State Management**: For hub app (Context vs external library)
5. **Styling**: Tailwind CSS vs CSS Modules vs Styled Components

## Estimated Timeline

- **Week 1**: Phases 1-2 (Foundation + Manifest)
- **Week 2**: Phase 3 (Backend Server)
- **Week 3**: Phase 4 (Hub Application)
- **Week 4**: Phases 5-6 (Build System + Deployment)
- **Week 5**: Phases 7-9 (Documentation + Polish) 
