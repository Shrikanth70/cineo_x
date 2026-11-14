FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Do not hardcode PORT so hosting platforms (Render, Railway, Fly) can inject PORT (e.g. 10000)

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000 10000

CMD ["npm", "run", "start"]

