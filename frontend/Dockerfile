FROM node:20-alpine AS builder

WORKDIR /app

# Install deps and build
COPY package.json ./
RUN npm install --silent
COPY . ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy production build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

RUN npm install --omit=dev --silent

EXPOSE 3000
CMD ["npm", "start"]
