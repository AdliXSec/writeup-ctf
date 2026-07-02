FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=8160

EXPOSE 8160

CMD ["node", "server.js"]
