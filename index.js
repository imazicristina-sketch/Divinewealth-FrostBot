import mineflayer from 'mineflayer'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import collectBlockPlugin from 'mineflayer-collectblock'
import http from 'node:http'

const env = (key, fallback = '') => process.env[key] ?? fallback
const host = env('MC_HOST', 'ry9.terohost.in')
const port = Number(env('MC_PORT', '25866'))
const version = env('MC_VERSION', '26.3')
const username = env('BOT_USERNAME', 'Divinewealth')
const auth = env('MC_AUTH', 'offline')
const owner = env('OWNER_NAME', 'CatRexy').toLowerCase()
const trusted = new Set(
  env('TRUSTED_PLAYERS', `${username},${owner}`).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
)
trusted.add(username.toLowerCase())
trusted.add(owner)

let bot
let busy = false
let lastTask = 0
let guardianServer

const log = (...args) => console.log(new Date().toISOString(), '[Divinewealth]', ...args)
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function startGuardianServer() {
  if (env('ENABLE_GUARDIAN', 'true').toLowerCase() !== 'true') return
  const secret = env('GUARDIAN_TOKEN')
  if (!secret || secret === 'change-this-to-a-long-random-secret') {
    log('Guardian endpoint disabled: set a private GUARDIAN_TOKEN in Railway Variables.')
    return
  }

  guardianServer = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/theft') {
      res.writeHead(404).end('not found')
      return
    }
    if (req.headers['x-guardian-token'] !== secret) {
      res.writeHead(401).end('unauthorized')
      return
    }
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 8192) req.destroy()
    })
    req.on('end', () => {
      try {
        const event = JSON.parse(body)
        const playerName = String(event.player || '').trim()
        const kind = String(event.kind || '')
        if (!playerName || !['container', 'farm'].includes(kind)) {
          res.writeHead(400).end('invalid event')
          return
        }
        res.writeHead(202).end('accepted')
        defendAgainst(playerName, kind)
      } catch {
        res.writeHead(400).end('bad json')
      }
    })
  })
  guardianServer.listen(Number(env('GUARDIAN_PORT', '3000')), '0.0.0.0', () => {
    log(`Guardian event endpoint listening on ${env('GUARDIAN_PORT', '3000')}`)
  })
}

function defendAgainst(playerName, kind) {
  if (!bot || !bot.entity) return
  const name = playerName.toLowerCase()
  if (trusted.has(name)) {
    log(`Guardian ignored trusted player ${playerName}.`)
    return
  }
  const target = bot.players[playerName]?.entity
  if (!target) {
    log(`Guardian alert: ${playerName} triggered a protected ${kind} event but is not currently visible.`)
    bot.chat(`§e[Guardian] Protected ${kind} access detected from ${playerName}.`)
    return
  }
  log(`Guardian alert: verified protected ${kind} theft by ${playerName}.`)
  bot.chat(`§c[Guardian] Unauthorized ${kind} activity detected: ${playerName}.`)
  // The bot only retaliates after a server-side event from the companion plugin.
  // It does not attack players merely for standing near a chest or farm.
  try {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand').catch(() => {})
    bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
    const endAt = Date.now() + 12000
    const interval = setInterval(() => {
      if (!bot?.entity || !target.isValid || Date.now() > endAt) {
        clearInterval(interval)
        if (bot?.pathfinder) bot.pathfinder.setGoal(null)
        return
      }
      if (bot.entity.position.distanceTo(target.position) <= 4) {
        try { bot.attack(target) } catch {}
      }
    }, 650)
  } catch (err) {
    log('Guardian response error:', err.message)
  }
}

function countItem(name) {
  return bot.inventory.items().filter(item => item.name === name).reduce((sum, item) => sum + item.count, 0)
}

async function equipBestTool(type) {
  const items = bot.inventory.items()
  const priorities = type === 'pickaxe'
    ? ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe']
    : type === 'axe'
      ? ['netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe']
      : ['netherite_sword', 'diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword']
  const item = priorities.map(n => items.find(i => i.name === n)).find(Boolean)
  if (item) await bot.equip(item, 'hand').catch(() => {})
}

async function craftByName(name, amount = 1) {
  const item = bot.registry.itemsByName[name]
  if (!item) return false
  const recipes = bot.recipesFor(item.id, null, amount, null)
  if (!recipes.length) return false
  try {
    await bot.craft(recipes[0], amount, null)
    log(`Crafted ${amount} ${name}`)
    return true
  } catch (err) {
    log(`Could not craft ${name}: ${err.message}`)
    return false
  }
}

async function craftStarterKit() {
  const logs = bot.inventory.items().filter(i => i.name.endsWith('_log') || i.name.endsWith('_stem'))
  if (logs.length && countItem('oak_planks') + countItem('spruce_planks') + countItem('birch_planks') < 8) {
    const logItem = logs[0]
    const plankName = logItem.name.replace('_log', '_planks').replace('_stem', '_planks')
    const recipe = bot.recipesFor(bot.registry.itemsByName[plankName]?.id, null, 4, null)[0]
    if (recipe) await bot.craft(recipe, Math.min(4, logItem.count), null).catch(() => {})
  }

  const plankStack = bot.inventory.items().find(i => i.name.endsWith('_planks'))
  if (plankStack && !bot.inventory.items().some(i => i.name === 'crafting_table')) {
    await craftByName(plankStack.name, 4)
    await craftByName('crafting_table', 1)
  }

  const tableItem = bot.inventory.items().find(i => i.name === 'crafting_table')
  if (tableItem && !bot.findBlock({ matching: b => b.name === 'crafting_table', maxDistance: 4 })) {
    const below = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (below && below.boundingBox === 'block') {
      await bot.equip(tableItem, 'hand').catch(() => {})
      await bot.placeBlock(below, new (await import('vec3')).Vec3(0, 1, 0)).catch(() => {})
    }
  }

  const table = bot.findBlock({ matching: b => b.name === 'crafting_table', maxDistance: 5 })
  const planks = bot.inventory.items().find(i => i.name.endsWith('_planks'))
  if (planks) {
    const sticks = bot.registry.itemsByName.stick
    if (sticks && !countItem('stick')) {
      const recipes = bot.recipesFor(sticks.id, null, 4, table)
      if (recipes.length) await bot.craft(recipes[0], 1, table).catch(() => {})
    }
  }
  if (!bot.inventory.items().some(i => i.name.endsWith('_pickaxe'))) {
    const woodPick = bot.registry.itemsByName.wooden_pickaxe
    if (woodPick) {
      const recipes = bot.recipesFor(woodPick.id, null, 1, table)
      if (recipes.length) await bot.craft(recipes[0], 1, table).catch(() => {})
    }
  }
}

async function gatherLogs() {
  const logBlock = bot.findBlock({
    matching: block => block && (block.name.endsWith('_log') || block.name.endsWith('_stem')),
    maxDistance: 32
  })
  if (!logBlock) return false
  await equipBestTool('axe')
  log(`Collecting ${logBlock.name}`)
  await bot.collectBlock.collect(logBlock)
  return true
}

async function gatherStone() {
  const stone = bot.findBlock({
    matching: block => block && ['stone', 'cobblestone'].includes(block.name),
    maxDistance: 24
  })
  if (!stone) return false
  await equipBestTool('pickaxe')
  log(`Collecting ${stone.name}`)
  await bot.collectBlock.collect(stone)
  return true
}

async function eatIfNeeded() {
  if (bot.food >= 17) return
  const food = bot.inventory.items().find(i =>
    /bread|cooked_|apple|carrot|potato|berries|melon_slice/.test(i.name)
  )
  if (!food) return
  await bot.equip(food, 'hand').catch(() => {})
  await bot.consume().catch(() => {})
  log('Ate food to restore hunger.')
}

async function handleNearbyThreats() {
  const hostile = Object.values(bot.entities).find(entity =>
    entity.type === 'mob' &&
    entity.position &&
    bot.entity.position.distanceTo(entity.position) < 5 &&
    /zombie|skeleton|creeper|spider|witch|drowned|husk|pillager|phantom/.test(entity.name || '')
  )
  if (!hostile) return
  await equipBestTool('sword')
  try {
    bot.attack(hostile)
    log(`Defending against hostile mob: ${hostile.name}`)
  } catch {}
}

async function autonomousStep() {
  if (!bot?.entity || busy || Date.now() - lastTask < 1200) return
  busy = true
  lastTask = Date.now()
  try {
    await eatIfNeeded()
    await handleNearbyThreats()
    await craftStarterKit()

    const logs = bot.inventory.items().filter(i => i.name.endsWith('_log') || i.name.endsWith('_stem'))
      .reduce((n, i) => n + i.count, 0)
    const planks = bot.inventory.items().filter(i => i.name.endsWith('_planks'))
      .reduce((n, i) => n + i.count, 0)

    if (logs + planks < 12) {
      await gatherLogs()
    } else if (countItem('cobblestone') < 16 && bot.inventory.items().some(i => i.name.endsWith('_pickaxe'))) {
      await gatherStone()
    } else {
      // Stay near the last safe location rather than wandering indefinitely.
      bot.pathfinder.setGoal(null)
    }
  } catch (err) {
    log('Autonomy step:', err.message)
  } finally {
    busy = false
  }
}

function connect() {
  log(`Connecting to ${host}:${port} as ${username}, protocol ${version}...`)
  bot = mineflayer.createBot({
    host, port, username, version,
    auth,
    hideErrors: false,
    checkTimeoutInterval: 60000
  })
  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlockPlugin)

  bot.once('spawn', async () => {
    log('Joined the server!')
    const movements = new Movements(bot)
    movements.canDig = true
    movements.allow1by1towers = false
    bot.pathfinder.setMovements(movements)
    bot.chat('Hello! I am Divinewealth. My survival AI is starting.')
    await wait(2500)
    autonomousStep()
  })

  bot.on('health', () => {
    if (bot.health <= 8) bot.chat('I need to find safety and food!')
  })
  bot.on('kicked', reason => log('Kicked:', JSON.stringify(reason)))
  bot.on('error', err => log('Connection error:', err.message))
  bot.on('end', () => {
    log('Disconnected. Reconnecting in 15 seconds...')
    setTimeout(connect, 15000)
  })
  bot.on('chat', (player, message) => {
    if (trusted.has(player.toLowerCase()) && message.startsWith('!dw ')) {
      const cmd = message.slice(4).trim().toLowerCase()
      if (cmd === 'status') bot.chat(`Health ${Math.round(bot.health)}; food ${Math.round(bot.food)}; inventory ${bot.inventory.items().length} stacks.`)
      if (cmd === 'stop') { bot.pathfinder.setGoal(null); bot.chat('I stopped moving.') }
      if (cmd === 'follow') {
        const target = bot.players[player]?.entity
        if (target) bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
      }
      if (cmd === 'come') {
        const target = bot.players[player]?.entity
        if (target) bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 1))
      }
      if (cmd === 'resume') { bot.chat('Resuming survival tasks.'); autonomousStep() }
    }
  })

  setInterval(autonomousStep, 5000)
}

startGuardianServer()
connect()

process.on('SIGTERM', () => {
  log('Shutting down...')
  try { guardianServer?.close() } catch {}
  try { bot?.quit('Railway shutdown') } catch {}
  process.exit(0)
})
