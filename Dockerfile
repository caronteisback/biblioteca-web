# syntax=docker/dockerfile:1

# ---- build: Node compiles the panel into static files
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# An empty address makes the panel call the API on its own origin (/api), which nginx forwards.
ENV VITE_API_URL=""
RUN npm run build

# ---- run: nginx that does not need root, serving the files and forwarding /api to the API
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
