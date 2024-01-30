# Remote-Rotom

Remote-Rotom is an unofficial Discord bot for [Rotom](https://github.com/UnownHash/Rotom) by UnownHash, built with [Discord.js](https://discord.js.org).

## Features
- Only accepts interactions from users with a specific Discord role.
- Provides a simple status overview and detailed embeds for devices and their walkers.
- Supports commands for device restart, reboot, logcat retrieval, and running Rotom jobs.
- Periodically checks Rotom host and device status, alerting and triggering power cycle on downtime.

## Setup & Install
1. Clone the repository.
2. [Create a Discord Bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) and invite it to your server [following this guide](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links).
3. Copy `config.json.example` to `config.json` and customize it.
4. Run `npm install` and `npm run start`, or use `docker-compose.yml.example` as an example for Docker usage.

## Config
```json
{
	"token": "your-discord-bot-token-goes-here",
	"clientId": "your-discord-application-id-goes-here",
	"guildId": "your-discord-server-id-goes-here",
	"rotom": {
		"address": "http://rotom:7072"
	},
	"commandPermissionRole": "your-discord-role-id-goes-here",
	"deviceAlerts": {
		"enableDeviceCheck": false,
		"deviceCheckInterval": 60,
		"deviceAlertChannel": "your-discord-channel-id-goes-here",
		"deviceAlertRole": "your-discord-role-id-goes-here",
		"enablePowerCycle": false,
		"powerCycleAfterDeviceDowntime": 45,
		"devices": [
			{
				"origin": "your-device-origin-goes-here",
				"webhookPowerOff": "your-power-off-webhook-goes-here",
				"webhookPowerOn": "your-power-on-webhook-goes-here"
			}
		]
	}
}
```
Values for `deviceCheckInterval` and `powerCycleAfterDeviceDowntime` are in minutes.

## Commands
- `/device-status`: Replies with status overview and detailed embeds for all devices and walkers.
- `/device-control action:restart/reboot`: Select one or all devices for restart or reboot.
- `/device-get-logcat`: Sends the logcat of a single device via DM.
- `/run-job`: Select a Rotom Job to run on a single or all devices (limited to the first 25 jobs of your Rotom instance).
- `/job-status`: Shows overall status for the latest Rotom jobs with detailed embeds for each job.

## Device Alerts & Powercycle
If `enableDeviceCheck` is `true` and a time is set for `deviceCheckInterval`, the bot checks Rotom and device status on interval. Alerts are sent to `deviceAlertChannel`, mentioning `deviceAlertRole` if set. Power cycle requires device check to be enabled. If configured, the bot will search for the device origin of each offline device, and trigger the associated webhooks for power off and on.
Currently, alert messages won't be deleted automatically. I recommand setting up an Auto-Delete bot like [EAZYAUTODELETE](https://eazyautodelete.xyz) for this channel!

## Contribution
I am writing this bot in my spare time, for fun and to learn more about nodejs. So, this code will be far from being „good“ and needs every support it can get 🙃 please feel free to contribute in any way by opening a PR or creating an issue! 

## Open Tasks
- Test/optimize messages for many devices.
- Implement unlimited job selection/pagination for more than 25 jobs.
- Check for Rotom authentication process (currently tested without restrictions).
- Add Dragonite support.

## Credits
Many thanks to UnownHash for creating Rotom! Obviously this bot is worthless without it.

Also a big thanks to nileplumb for his awesome icon repository [PkmnHomeIcons](https://github.com/nileplumb/PkmnHomeIcons), which I am using in this app.
