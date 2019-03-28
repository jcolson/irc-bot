#!/usr/bin/env node
'use strict';
const Irc = require('simple-irc');
const dotenv = require('dotenv');
const path = require('path');
const Parser = require('rss-parser');

const DEFAULT_SERVER = 'irc.snoonet.org';
const DEFAULT_PORT = '6697';
const DEFAULT_NICK = 'irc_bot';
const DEFAULT_USERNAME = 'irc_username';
const DEFAULT_PASSWORD = 'secret';
const DEFAULT_CHANNEL = '#cancer';
const DEFAULT_SECURE = true;
const DEFAULT_RSS = 'https://news.google.com/rss/search?q=pancreatic+cancer';
const DEFAULT_RSS_INT = 3600000;

const opt = require('node-getopt').create([
  [ 'h', 'help',            'Show this help' ],
  [ 's', 'server={server.fqdn}',   'IRC Server to connect (default: ' + DEFAULT_SERVER + ')' ],
  [ 'p', 'port={server port}',   'Port number to connect (default: ' + DEFAULT_PORT + ')' ],
  [ 'n', 'nick={irc nickname}',   'Nick name to use on irc (default: ' + DEFAULT_NICK + ')' ],
  [ 'u', 'username={irc username}',   'User name to use on irc (default: ' + DEFAULT_USERNAME + ')' ],
  [ 'p', 'password={irc passworf}',   'Password to use on irc (default: ' + DEFAULT_PASSWORD + ')' ],
  [ 'c', 'channel={irc channel}',   'Channel to join on irc (default: ' + DEFAULT_CHANNEL + ')' ],
  [ 'c', 'secure={boolean}',   'Use TLS for irc (default: ' + DEFAULT_SECURE + ')' ],
  [ 'r', 'rss={url}',   'RSS url used for bot (default: ' + DEFAULT_RSS + ')' ],
  [ 'i', 'rssint={url}',   'RSS url used for bot (default: ' + DEFAULT_RSS_INT + ')' ],
]).bindHelp().parseSystem();
// load .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.debug('post dotenv');
let server = opt.options.server || process.env.SERVER || DEFAULT_SERVER;
let secure = opt.options.secure || process.env.SECURE || DEFAULT_SECURE;
let port = opt.options.port || process.env.PORT || DEFAULT_PORT;
let nick = opt.options.nick || process.env.NICK || DEFAULT_NICK;
let authType = Irc().authType.saslPlain;
let username = opt.options.username || process.env.USERNAME || DEFAULT_USERNAME;
let password = opt.options.password || process.env.PASSWORD || DEFAULT_PASSWORD;
let channel = opt.options.channel || process.env.CHANNEL || DEFAULT_CHANNEL;
let rss = opt.options.rss || process.env.RSS || DEFAULT_RSS;
let rssint = opt.options.rss || process.env.RSS_INT || DEFAULT_RSS_INT;
let config = {
  server: {
    address: server,
    port: port,
  },
  userInfo: { nick: nick,
    auth: {
      type: authType,
      user: username,
      password: password,
      secure: secure,
    },
  },
  channels: [
    { name: channel,
    },
  ],
};

console.debug(config);

let bot = new Irc(config);

bot.onChannelJoined = function(e){
  // this.sendMessage({ to: e.channel, message: 'Hello I am ' + nick });
  console.debug('Channel joined: ' + e.channel);
};

bot.onData = function(e){ console.debug('DEBUG: ' + e.data); };

bot.onPrivmsg = function(e){
  if (!e.toChannel) {
    e.reply('Hello to you!');
  } else {
    handleCommands(e);
  }
};

setInterval(() => {
  doRss();
}, rssint);

function doRss() {
  console.log('doing rss work ...');
  let parser = new Parser();
  (async() => {

    let feed = await parser.parseURL(rss);
    console.log(feed.title);
    if (feed.items[0]) {
      console.log(feed.items[0].title + ':' + feed.items[0].link);
      let message = {to: '#cancer', message: feed.items[0].title + ': ' + feed.items[0].link};
      bot.sendMessage(message);
    }
  })();
}

function handleCommands(e) {
  console.log(e);
  if (e.message.substring(0, 1) === '!') {
    let command = e.message.substring(1).toUpperCase();
    console.log('command found: ' + command);
    switch (command) {
      case 'HELP':
        console.log('help command found');
        e.reply('HELP information:');
        e.reply('HELP -> this menu');
        break;
    }
  }
}
