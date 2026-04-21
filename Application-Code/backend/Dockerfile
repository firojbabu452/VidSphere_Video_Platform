# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# Clean install including all dependencies
RUN npm install
COPY . .

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy necessary artifacts
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src

# Security: Essential for EKS/Production
USER node

EXPOSE 8000

# Start command
CMD ["node", "src/index.js"]
