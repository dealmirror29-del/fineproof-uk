FROM node:20-alpine

WORKDIR /usr/src/app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy worker and necessary files
COPY tools/worker.js ./tools/worker.js

ENV NODE_ENV=production

CMD ["node", "tools/worker.js"]
