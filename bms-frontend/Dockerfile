# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# relative URL: nginx (below) proxies /api and /socket.io to the backend, so there is no CORS / cookie trouble
ARG VITE_BACKEND_URL=/api/v1
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
