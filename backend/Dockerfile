# FROM node:24-alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 5000

# CMD ["npm","run","dev","--","--host"]

FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["npm","run","dev","--","--host"]

