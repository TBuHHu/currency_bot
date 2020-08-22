require('dotenv').config();
const { MongoClient } = require('mongodb');
const { Telegraf } = require('telegraf');
const request = require('request');
const cron = require('node-cron');

const bot = new Telegraf(process.env.BOT_TOKEN);
const uri = process.env.MONGO_DB;
const client = new MongoClient(uri);

let collection;
let database;
let usdValue;
let eurValue;

client.connect(() => {
  database = client.db('tbh_currency_bot');
  collection = database.collection('users');
});

request('https://www.cbr-xml-daily.ru/daily_json.js', (error, response, body) => {
  const data = JSON.parse(body);
  usdValue = data.Valute.USD.Value;
  eurValue = data.Valute.EUR.Value;
});

async function newUser(ctx) {
  try {
    const query = { id: ctx.chat.id };
    console.log(query);
    const newUserId = await collection.findOne(query);
    console.log(newUserId);
    if (newUserId != null) {
      console.log('This ID was added before');
    } else {
      await collection.insertOne(query);
      console.log('ID added to DB');
    }
  } catch (e) {
    console.log(e);
  }
}

bot.start((ctx) => {
  ctx.reply(
    `Привет, ${ctx.message.from.first_name}!\nЯ буду отправлять тебе акутальные данные каждый день в 12:00 по Московскому времени.`
  );
  newUser(ctx).catch(console.dir);
});

bot.command('now', (ctx) =>
  ctx.reply(`Курс доллара на сегодня — ${usdValue}\nКурс евро — ${eurValue}`)
);

cron.schedule(
  '00 12 * * Monday,Tuesday,Wednesday,Thursday,Friday',
  () => {
    collection.find().toArray((err, result) => {
      if (err) throw err;
      for (let i = 0; i < result.length; i++) {
        const userId = result[i].id;
        bot.telegram
          .sendMessage(userId, `Курс доллара на сегодня — ${usdValue}\nКурс евро — ${eurValue}`)
          .catch(() => collection.deleteOne({ id: userId }));
      }
    });
  },
  {
    scheduled: true,
    timezone: 'Europe/Moscow',
  }
);

bot.launch();
console.log('Bot has been started...');
