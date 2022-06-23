FROM node:slim

COPY . /usr/local/dbecho
RUN cd /usr/local/dbecho && npm i

WORKDIR /usr/local/dbecho
CMD ["node", "."]

