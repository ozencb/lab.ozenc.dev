# lab.ozenc.dev

Monorepo for web stuff

## Project Overview
A PNPM monorepo hosting platform for experimental web applications with a central manifest system, backend routing, and individual project serving.

"server" provides endpoints for fetching all projects that is available in the manifest.json file. And it serves the projects themselves. And it has some validations for the manifest file. The "hub" app is the main app (root "/" is redirected to "/hub" as well) and serves as the entry point for the platform.

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
```
