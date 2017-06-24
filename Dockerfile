FROM node:7.9.0

# install project dependencies
RUN mkdir -p /usr/src/streakeeper
WORKDIR /usr/src/streakeeper
COPY package.json yarn.lock /usr/src/streakeeper/
RUN yarn

# set up source tree
COPY . /usr/src/streakeeper
VOLUME /usr/src/streakeeper
