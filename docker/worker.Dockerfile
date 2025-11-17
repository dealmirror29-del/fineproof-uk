FROM node:20-bullseye-slim

WORKDIR /usr/src/app

# Install system dependencies required by Chromium/Puppeteer
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		ca-certificates \
		wget \
		gnupg \
		fonts-liberation \
		libnspr4 \
		libnss3 \
		libatk1.0-0 \
		libatk-bridge2.0-0 \
		libcups2 \
		libxss1 \
		libasound2 \
		libx11-xcb1 \
		libxcomposite1 \
		libxdamage1 \
		libxrandr2 \
		libgbm1 \
		libx11-6 \
		libxrender1 \
		libxtst6 \
		libpangocairo-1.0-0 \
		libpango-1.0-0 \
		libgtk-3-0 \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files and install production deps (this will download Chromium via puppeteer)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy worker
COPY tools/worker.js ./tools/worker.js

ENV NODE_ENV=production

# Ensure Puppeteer uses its downloaded Chromium (default) and run worker
CMD ["node", "tools/worker.js"]
