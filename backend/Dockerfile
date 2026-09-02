FROM node:lts-trixie-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
