# Looking Glass - MCP-Controllable Adaptive UI
# Multi-stage build: Node for building, nginx for serving

# ============================================================================
# Stage 1: Build
# ============================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy all package.json files
COPY packages/core/package.json packages/core/tsconfig.json ./packages/core/
COPY packages/shell/package.json packages/shell/tsconfig.json ./packages/shell/
COPY packages/chat/package.json packages/chat/tsconfig.json ./packages/chat/
COPY apps/zoe/package.json apps/zoe/tsconfig.json ./apps/zoe/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/zoe/ ./apps/zoe/

# Build all packages (turborepo handles dependency order)
# Increase Node memory for TypeScript declaration generation
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# ============================================================================
# Stage 2: Serve
# ============================================================================
FROM nginx:alpine AS runtime

# Copy built assets from builder
COPY --from=builder /app/apps/zoe/dist /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
