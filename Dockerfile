# Basic install of exo-docker
#
# Currently install exo-docker

FROM node:latest
MAINTAINER Agustin Croce

RUN apt-get update -y \
 && apt-get install -y git libsodium-dev\
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

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
