require('dotenv').config()
const { MongoClient } = require("mongodb");
const { Telegraf, Telegram } = require('telegraf');
const request = require('request');
const cron = require('node-cron');
var fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);
const uri = process.env.MONGO_DB;
const client = new MongoClient(uri);
client.connect();

var usdValue;
var eurValue;

request('https://www.cbr-xml-daily.ru/daily_json.js', function (error, response, body) {
  var data = JSON.parse(body);
  usdValue = data.Valute.USD.Value;
  eurValue = data.Valute.EUR.Value;
}); 

async function newUser(ctx) {
  try {
    const database = client.db('tbh_currency_bot');
    const collection = database.collection('users');
    const query = { id: ctx.chat.id };
    console.log(query);
    const newUserId = await collection.findOne(query);
    console.log(newUserId);
      if (newUserId != null) {
        console.log('This ID was added before');
      } else {
        await collection.insertOne(query);
        console.log('ID added to DB');
      };
    }
    catch(e) {
      console.log(e);
    };
  };

bot.start((ctx) => {
  ctx.reply('Привет!\nЯ буду отправлять тебе акутальные данные каждый день в 12:00 по Московскому времени.');
  newUser(ctx).catch(console.dir);});

bot.command('now', (ctx) => ctx.reply('Курс доллара на сегодня — ' + usdValue + '\n' + 'Курс евро — ' + eurValue));

// cron.schedule(' 00 12 * * *', () => {
//   for (const i in chatIdDataBase.id) {
//     var id = chatIdDataBase.id[i];
//     bot.telegram.sendMessage(id, 'Курс доллара на сегодня — ' + usdValue + '\n' + 'Курс евро — ' + eurValue)
//     .catch((e) => 
//       { chatIdDataBase.id.splice(i,1); 
//         fs.writeFileSync('./chatIdArray.json', JSON.stringify(chatIdDataBase, null, 2)); 
//       });
//     console.log(chatIdDataBase.id);
//   }
// });

bot.launch();
console.log('Bot has been started...');