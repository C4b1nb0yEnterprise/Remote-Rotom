FROM node:current-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .