#!/usr/bin/env node
'use strict';
const Irc = require('simple-irc');
const dotenv = require('dotenv');
const path = require('path');
const Parser = require('rss-parser');
const fs = require('fs');
const _DATABASE = 'irc-bot-database.json';

const DEFAULT_SERVER = 'irc.snoonet.org';
const DEFAULT_PORT = '6697';
const DEFAULT_NICK = 'irc_bot';
const DEFAULT_USERNAME = 'irc_username';
const DEFAULT_PASSWORD = 'secret';
const DEFAULT_CHANNEL = '#cancer';
const DEFAULT_SECURE = true;
const DEFAULT_RSS = ['https://news.google.com/rss/search?q=pancreatic+cancer+when:7d',
  'https://www.reddit.com/r/cancer/new/.rss?sort=new'];
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

let server = opt.options.server || process.env.SERVER || DEFAULT_SERVER;
let secure = opt.options.secure || process.env.SECURE || DEFAULT_SECURE;
let port = opt.options.port || process.env.PORT || DEFAULT_PORT;
let nick = opt.options.nick || process.env.NICK || DEFAULT_NICK;
let authType = Irc().authType.saslPlain;
let username = opt.options.username || process.env.USERNAME || DEFAULT_USERNAME;
let password = opt.options.password || process.env.PASSWORD || DEFAULT_PASSWORD;
let channel = opt.options.channel || process.env.CHANNEL || DEFAULT_CHANNEL;
let rss = opt.options.rss || process.env.RSS.split(',') || DEFAULT_RSS;
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

// console.debug(config);
console.debug(rssint);
console.debug(rss);

let bot = new Irc(config);
let databaseJson = {};

bot.onChannelJoined = function(e){
  // this.sendMessage({ to: e.channel, message: 'Hello I am ' + nick });
  console.debug('Channel joined: ' + e.channel);
};

// bot.onData = function(e){ console.debug('DEBUG: ' + e.data); };

bot.onPrivmsg = function(e){
  if (!e.toChannel) {
    e.reply('Hello to you!');
    handleCommands(e);
  } else {
    handleCommands(e);
  }
};

setInterval(async() => {
  for (let url of rss) {
    let feed = await getRssFeed(url);
    // console.log(feed);
    if (feed.items[0]) {
      console.log(feed.items[0].title + ':' + feed.items[0].link);
      if (!databaseJson.rss[url]) {
        databaseJson.rss[url] = {};
      }
      console.log('lastrssguid: ' + databaseJson.rss[url].lastRssGuid);
      let rssGuid;
      if (feed.items[0].guid) {
        rssGuid = feed.items[0].guid;
      } else {
        rssGuid = feed.items[0].id;
      }
      console.log('current rss guid: ' + rssGuid);
      if (rssGuid !== databaseJson.rss[url].lastRssGuid) {
        databaseJson.rss[url].lastRssGuid = rssGuid;
        let message = {to: '#cancer', message: feed.items[0].title + ': ' + feed.items[0].link};
        bot.sendMessage(message);
      } else {
        console.log('already spewed this rss, will be quiet for now');
      }
    }
  }
}, rssint);

readDB();

process.on('SIGTERM', async() => {
  console.log('Caught termination signal');
  await persistDB();
  process.exit();
});
process.on('SIGINT', async() => {
  console.log('Caught interrupt signal');
  await persistDB();
  process.exit();
});
process.on('exit', async() => {
  console.log('Caught exit signal');
  await persistDB();
  process.exit();
});
process.on('SIGUSR1', async() => {
  console.log('Caught exit signal');
  await persistDB();
  process.exit();
});
process.on('SIGUSR2', async() => {
  console.log('Caught exit signal');
  await persistDB();
  process.exit();
});

function getRssFeed(url) {
  console.log('retrieving RSS: ' + url);
  let parser = new Parser();
  return new Promise((resolve, reject) => {
    resolve(parser.parseURL(url));
  });
}

async function handleCommands(e) {
  console.log(e);
  if (e.message.substring(0, 1) === '!') {
    let command = e.message.substring(1).toUpperCase();
    console.log('command found: ' + command);
    switch (command) {
      case 'HELP':
        console.log('help command issued');
        e.reply('HELP information:');
        e.reply('HELP -> this menu');
        e.reply('RSS -> pull the current RSS entries');
        break;
      case 'RSS':
        console.log('RSS command issued');
        for (let url of rss) {
          let feed = await getRssFeed(url);
          for (var i = 0; i < (feed.items.length < 3 ? feed.items.length : 3); i++) {
            e.reply(feed.items[i].title + ': ' + feed.items[i].link);
          }
        }
        break;
    }
  }
}
function persistDB() {
  fs.writeFileSync(path.resolve(__dirname, _DATABASE), JSON.stringify(databaseJson), 'utf8');
  console.log('wrote database json');
}
function readDB() {
  try {
    databaseJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, _DATABASE), 'utf8'));
  } catch (e) {
    console.error('Caught exception loading database, initializing.', e);
    initializDB();
  }
  console.log('read database json');
}
function initializDB() {
  if (!databaseJson.rss) {
    console.log('populating empty rss for first time');
    databaseJson.rss = {};
  }
}
