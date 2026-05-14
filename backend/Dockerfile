FROM node:20-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libreoffice fonts-dejavu fontconfig \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate || true

EXPOSE 5000

CMD ["npm", "start"]
