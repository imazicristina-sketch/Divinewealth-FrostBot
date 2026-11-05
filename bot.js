const mineflayer = require('@wp2508/mineflayer')

console.log('Starting Mira bot...')

const bot = mineflayer.createBot({
  host: 'ry9.terohost.in',
  port: 25866,
  username: 'Mira',
  auth: 'offline',
  version: '26.3'
})

bot.on('connect', () => console.log('TCP CONNECTED'))
bot.on('login', () => console.log('LOGIN SUCCESS'))
bot.on('spawn', () => console.log('BOT SPAWNED'))

bot.on('kicked', reason => {
  console.log('KICKED:', JSON.stringify(reason))
})

bot.on('error', err => {
  console.log('ERROR:', err.stack || err)
})

bot.on('end', reason => {
  console.log('DISCONNECTED REASON:', reason)
})
