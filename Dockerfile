FROM node:22-slim as base

WORKDIR /app

RUN npm install -g pnpm

FROM base as deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
COPY shared/package.json shared/package.json

COPY apps/ ./apps/
RUN find apps -type f -not -name "package.json" -delete && find apps -type d -empty -delete

RUN pnpm install --frozen-lockfile

FROM deps as build

COPY . .

RUN pnpm run build

RUN mkdir -p /app/production/server
RUN pnpm --filter @lab.ozenc.dev/server deploy /app/production/server

RUN mkdir -p /app/production/apps && \
    find /app/apps -mindepth 1 -maxdepth 1 -type d -exec sh -c 'for app_dir do \
        app_name=$(basename "$app_dir"); \
        if [ -d "$app_dir/dist" ]; then \
            mkdir -p "/app/production/apps/$app_name"; \
            cp -a "$app_dir/dist" "/app/production/apps/$app_name/"; \
        else \
            cp -a "$app_dir" "/app/production/apps/"; \
        fi; \
    done' sh {} +

FROM base as runner

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/production .
WORKDIR /app/server

EXPOSE 3000
CMD ["pnpm", "start"]
