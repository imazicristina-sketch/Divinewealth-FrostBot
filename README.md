# Divinewealth FrostBot 1.0.1

A Mineflayer-based Minecraft Java bot starter configured for Railway.

## Important compatibility note

Minecraft server version `26.3` support depends on the Mineflayer fork and protocol support available at runtime. This project requests version `26.3`; if the library reports that the version is unsupported, the bot library must be updated before it can connect. The ZIP fixes the project layout and Railway startup command, but cannot guarantee protocol compatibility with every server build.

## GitHub layout

Upload these files directly into the repository root:

- `index.js`
- `package.json`
- `railway.json`
- `.env.example`
- `.gitignore`
- `README.md`

There must not be a requirement for `src/index.js`. The start command is `npm start`, which runs `node index.js`.

## Railway setup

1. Upload/replace the files in the root of your GitHub repository and commit the changes to `main`.
2. In Railway, make sure the service is connected to that repository and branch.
3. Enable Auto Deploy, or manually deploy the latest commit.
4. Open **Variables** and add:

| Variable | Value |
|---|---|
| `MC_HOST` | `ry9.terohost.in` |
| `MC_PORT` | `25866` |
| `MC_USERNAME` | `Divinewealth` |
| `MC_AUTH` | `offline` for an offline-mode server; use the appropriate supported auth mode for your server |
| `MC_VERSION` | `26.3` |
| `AUTO_RECONNECT` | `true` |

5. Deploy and inspect the logs.

## Chat commands

- `divinewealth come` — asks the bot to walk near the player who sent the message.
- `divinewealth status` — reports health and food.
- `divinewealth stop` — stops its current pathfinding goal.

The bot also attempts to eat suitable food from its inventory when its food level is low.

## Security

Do not publish account passwords, access tokens, or other secrets in GitHub. Put private configuration in Railway Variables.
