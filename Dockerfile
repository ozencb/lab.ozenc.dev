
# Use the official Node.js 22 image.
FROM node:22-slim

# Set the working directory in the container
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy server and shared package.json files
COPY server/package.json server/
COPY shared/package.json shared/

# Install dependencies
RUN pnpm install --prod

# Copy the rest of the monorepo source code
COPY . .

# Build the server and shared packages
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the server
CMD ["pnpm", "start"]
