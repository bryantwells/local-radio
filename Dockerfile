# syntax=docker/dockerfile:1
FROM node:alpine as base
WORKDIR /app
COPY package.json package-lock.json ./
RUN rm -rf node_modules && npm ci
COPY . .
CMD ["node", "bin/www"]