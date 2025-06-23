
FROM node:18-alpine


WORKDIR /app


RUN apk add --no-cache \
    go \
    gcc \
    musl-dev \
    linux-headers \
    mesa-dri-gallium \
    libxcursor-dev \
    libxrandr-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxext-dev \
    libxfixes-dev \
    libxinerama-dev \
    libxrender-dev \
    libxtst-dev \
    git \
    bash


ENV CGO_ENABLED=1


COPY package.json package-lock.json ./
COPY go-mod-template ./go-mod-template



RUN npm install --production=false


COPY . .


RUN npm run build


CMD ["node", "dist/main.js"]
