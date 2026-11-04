# Divinewealth FrostBot 1.0.0

A Railway-hosted Mineflayer survival-bot starter for a Minecraft Java Paper 26.3 server.

## What is included

- Connects as `Divinewealth` to the configured Minecraft host and port.
- Uses the `@wp2508/mineflayer` fork pinned at `4.42.7`, which advertises Minecraft 26.3 support.
- Basic autonomous survival loop: food use, nearby hostile-mob defense, tree-log collection, starter crafting, and some stone collection.
- Reconnects after disconnects.
- Trusted-player chat commands: `!dw status`, `!dw stop`, `!dw follow`, `!dw come`, `!dw resume`.
- Optional Paper companion plugin for configured protected chests/barrels and mature crops in configured farm regions. It reports server-side events to the bot. The bot only retaliates after a verified report and never attacks a player merely for standing nearby.

## Important limitations

This is a starter AI, not a human-level Minecraft player. It does not yet understand every recipe, build arbitrary structures, or make perfect survival decisions. Test it in a safe area first.

The guardian only watches locations explicitly listed in the Paper plugin config. Container withdrawal detection is based on the protected container's total item count decreasing after a click; complex inventory interactions may need testing on your exact Paper build. Farm alerts are for mature ageable crops broken inside configured regions. Keep trusted names accurate.

The bot's guardian endpoint must be reachable from the Minecraft server. If Railway uses a public domain, use that domain in the plugin webhook. If the server host cannot reach Railway's service port, guardian notifications will not arrive. Do not expose the endpoint without a long random token.

## Railway setup

1. Push/upload this project so `package.json`, `railway.json`, and the `src` folder are at the repository root.
2. In Railway, deploy the GitHub repository.
3. Open the service's **Variables** tab and add:
   - `MC_HOST` = `ry9.terohost.in`
   - `MC_PORT` = `25866`
   - `MC_VERSION` = `26.3`
   - `BOT_USERNAME` = `Divinewealth`
   - `MC_AUTH` = `offline` only if the server is configured for offline-mode accounts; otherwise use Microsoft authentication and complete the supported login flow.
   - `OWNER_NAME` = your exact Minecraft username
   - `TRUSTED_PLAYERS` = comma-separated trusted usernames
   - `GUARDIAN_TOKEN` = a long random secret
   - `GUARDIAN_PORT` = `3000`
   - `ENABLE_GUARDIAN` = `true`
4. Ensure Railway deploys with `npm start`.
5. Check Deploy Logs. A successful login should show `Joined the server!`.

Do not put your Microsoft password or other account passwords in this project.

## Paper guardian plugin setup

The optional plugin source is in `guardian-plugin/`.

1. Build it with JDK 25 and Gradle: from `guardian-plugin`, run `gradle build`.
2. Use the generated JAR in `guardian-plugin/build/libs/` and place it in the Paper server's `plugins` folder.
3. Restart Paper once to generate `plugins/DivinewealthGuardian/config.yml`.
4. Edit that config:
   - Set `token` to exactly the same secret as Railway's `GUARDIAN_TOKEN`.
   - Set `webhook` to `http://YOUR-RAILWAY-PUBLIC-DOMAIN:3000/theft` (use your actual Railway public domain; the endpoint must be reachable from the server).
   - Add protected chest/barrel coordinates to `protected-containers`.
   - Set the farm cuboids in `protected-farms`.
   - Add trusted players.
5. Restart Paper and test with a non-trusted test account in a protected area.

If you cannot build/install a Paper plugin on your host, ordinary Mineflayer cannot reliably know who took items from another player's chest. Leave guardian mode off rather than using proximity guesses that could target innocent players.

## Commands

Only trusted players can use these in chat:

- `!dw status`
- `!dw stop`
- `!dw follow`
- `!dw come`
- `!dw resume`

## Version compatibility

The Mineflayer fork package metadata advertises Minecraft 26.3 support. That does not guarantee compatibility with every Paper build, plugin combination, proxy, or host configuration. Verify with your actual server before relying on it.
