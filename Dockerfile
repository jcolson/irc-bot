FROM alpine:3.11

COPY irc-bot.js /
COPY package.json /
COPY package-lock.json /

RUN apk add nodejs
RUN apk add npm
RUN apk add git
RUN npm install

#HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:8080/metrics || exit 1

CMD CONFIGDIR=/config /irc-bot.js
