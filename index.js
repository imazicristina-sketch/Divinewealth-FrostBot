import mineflayer from "mineflayer";
import { pathfinder, Movements, goals } from "mineflayer-pathfinder";
import collectBlockPlugin from "mineflayer-collectblock";

const {
  GoalNear
} = goals;

const host = process.env.MC_HOST || "ry9.terohost.in";
const port = Number(process.env.MC_PORT || 25866);
const username = process.env.MC_USERNAME || "Divinewealth";
const auth = process.env.MC_AUTH || "offline";
const version = process.env.MC_VERSION || "26.3";
const autoReconnect = (process.env.AUTO_RECONNECT || "true").toLowerCase() === "true";

let reconnectTimer;
let stopping = false;

function log(message) {
  console.log(`[Divinewealth] ${message}`);
}

function startBot() {
  if (stopping) return;

  log(`Connecting to ${host}:${port} as ${username}...`);

  const bot = mineflayer.createBot({
    host,
    port,
    username,
    auth,
    version
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(collectBlockPlugin);

  let isEating = false;

  bot.once("spawn", () => {
    log("Spawned successfully.");
    const movements = new Movements(bot);
    movements.canDig = true;
    bot.pathfinder.setMovements(movements);
    bot.chat("Hello! I am Divinewealth.");
  });

  bot.on("health", async () => {
    if (isEating || !bot.food || bot.food >= 18) return;
    isEating = true;
    try {
      const food = bot.inventory.items().find(item =>
        /bread|apple|carrot|potato|beetroot|cooked|stew|melon|berries|cookie|pumpkin_pie/i.test(item.name)
      );
      if (food) {
        await bot.equip(food, "hand");
        await bot.consume();
        log(`Ate ${food.name}.`);
      }
    } catch (error) {
      log(`Could not eat: ${error.message}`);
    } finally {
      isEating = false;
    }
  });

  bot.on("chat", async (player, message) => {
    if (player === bot.username) return;
    const text = message.trim().toLowerCase();

    if (text === "divinewealth come") {
      const target = bot.players[player]?.entity;
      if (!target) {
        bot.chat(`I cannot see ${player} right now.`);
        return;
      }
      try {
        await bot.pathfinder.goto(new GoalNear(
          target.position.x, target.position.y, target.position.z, 2
        ));
        bot.chat(`I'm here, ${player}.`);
      } catch {
        bot.chat("I couldn't find a safe path there.");
      }
    } else if (text === "divinewealth status") {
      bot.chat(`Health ${Math.round(bot.health)}; food ${Math.round(bot.food)}.`);
    } else if (text === "divinewealth stop") {
      bot.pathfinder.setGoal(null);
      bot.chat("Okay, I stopped moving.");
    }
  });

  bot.on("kicked", reason => log(`Kicked: ${JSON.stringify(reason)}`));
  bot.on("error", error => log(`Error: ${error.message}`));

  bot.on("end", () => {
    log("Disconnected.");
    if (autoReconnect && !stopping) {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(startBot, 10000);
      log("Reconnecting in 10 seconds...");
    }
  });
}

process.on("SIGINT", () => {
  stopping = true;
  clearTimeout(reconnectTimer);
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopping = true;
  clearTimeout(reconnectTimer);
  process.exit(0);
});

startBot();
