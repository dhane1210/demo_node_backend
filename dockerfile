FROM node:lts-alpine3.22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit-dev 

COPY . .

RUN npm run build


FROM node:lts-alpine3.22 AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
