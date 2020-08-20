require('dotenv').config()
const { Telegraf, Telegram } = require('telegraf');
const request = require('request');
const cron = require('node-cron');
const bot = new Telegraf(process.env.BOT_TOKEN);
var fs = require('fs');

var usdValue;
var eurValue;
var chatIdDataBase = JSON.parse(fs.readFileSync('./chatIdArray.json', 'utf-8'));

request('https://www.cbr-xml-daily.ru/daily_json.js', function (error, response, body) {
  var data = JSON.parse(body);
  usdValue = data.Valute.USD.Value;
  eurValue = data.Valute.EUR.Value;
}); 

bot.start((ctx) => {
  ctx.reply('Привет!\nЯ буду отправлять тебе акутальные данные каждый день в 12:00 по Московскому времени.');
  if (chatIdDataBase.id.indexOf(ctx.chat.id) != -1) {
    console.log('This ID was added before');
  } else {
    chatIdDataBase.id.push(ctx.chat.id);
  }
  console.log(chatIdDataBase);
  fs.writeFileSync('./chatIdArray.json', JSON.stringify(chatIdDataBase, null, 2));
});
bot.command('now', (ctx) => ctx.replyWithMarkdown('Курс доллара на сегодня — ' + usdValue + '\n' + 'Курс евро — ' + eurValue));

cron.schedule(' 00 12 * * *', () => {
  for (const i in chatIdDataBase.id) {
    var id = chatIdDataBase.id[i];
    bot.telegram.sendMessage(id, 'Курс доллара на сегодня — ' + usdValue + '\n' + 'Курс евро — ' + eurValue)
    .catch((e) => 
      { chatIdDataBase.id.splice(i,1); 
        fs.writeFileSync('./chatIdArray.json', JSON.stringify(chatIdDataBase, null, 2)); 
      });
    console.log(chatIdDataBase.id);
  }
});

bot.launch();
console.log('Bot has been started...');