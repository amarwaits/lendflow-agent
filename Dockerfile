FROM node:20-alpine AS builder
WORKDIR /app
COPY backend_node/package*.json ./backend_node/
RUN cd backend_node && npm ci
COPY backend_node/ ./backend_node/
RUN cd backend_node && npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/backend_node/dist ./backend_node/dist
COPY --from=builder /app/backend_node/package*.json ./backend_node/
RUN cd backend_node && npm ci --omit=dev
EXPOSE 8001
CMD ["node", "backend_node/dist/index.js"]
