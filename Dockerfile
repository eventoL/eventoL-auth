# Basic install of exo-docker
#
# Currently install exo-docker

FROM node:6.9-alpine
MAINTAINER Agustin Croce

RUN apk add --update git make g++ libtool autoconf automake python && rm -rf /tmp/* /var/cache/apk/*

RUN npm config set registry http://registry.npmjs.org \
 && npm cache clean

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN touch .env

COPY package.json /usr/src/app/
RUN npm install --unsafe-perm\
 && npm cache clean
COPY . /usr/src/app

CMD [ "npm", "start" ]
