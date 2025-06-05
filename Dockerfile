
# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally (if you were using pnpm, otherwise skip or use npm/yarn)
# RUN npm install -g pnpm

# Copy package.json and lock file
# If using pnpm, copy pnpm-lock.yaml. For npm, copy package-lock.json. For yarn, yarn.lock.
COPY package.json ./
COPY package-lock.json ./
# COPY pnpm-lock.yaml ./

# Install dependencies
# If using pnpm: RUN pnpm install --frozen-lockfile --prod
# If using yarn: RUN yarn install --frozen-lockfile --production
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production image - copy only necessary files from the builder stage
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# If you copied package-lock.json in builder and ran npm ci, you might not need node_modules here
# or you might need to copy the production node_modules from the builder
COPY --from=builder /app/node_modules ./node_modules
# If your next.config.ts is essential for runtime (e.g. for image domains not handled by build), copy it.
# Otherwise, for standalone output, it might not be needed here.
# COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port Next.js runs on (default 3000, can be changed with -p flag in docker run or an environment variable)
EXPOSE 3000

# Command to run the Next.js application
# This will execute `next start` as defined in your package.json scripts
CMD ["npm", "start"]
