FROM node:lts-alpine as base
WORKDIR /
COPY package.json /
COPY . /   
EXPOSE 3000

FROM base as production
ENV NODE_ENV=production
RUN npm install
COPY . /
CMD node index.js

FROM base as dev
ENV NODE_ENV=development
RUN npm install -g nodemon && npm install
COPY . /
CMD npm run start