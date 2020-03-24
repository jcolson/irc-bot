# irc-bot

run by ./irc-bot.js

## Create docker image

```sh
docker build -t karmanet/ircbot .
```

## Run docker container

```sh
docker run --name ircbot -v ${CONFIGDIR}:/config --restart always -d karmanet/ircbot
```

Run interactively

```sh
docker run -v /Users/jcolson/src/personal/irc-bot:/config -it karmanet/ircbot sh
```

## Push docker image

```sh
docker login docker.io
docker push karmanet/ircbot
```
