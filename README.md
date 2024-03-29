# Remote-Rotom

Remote-Rotom is an unofficial Discord bot for [Rotom](https://github.com/UnownHash/Rotom) and [Dragonite](https://github.com/UnownHash/Dragonite-Public) by UnownHash, built with [Discord.js](https://discord.js.org).

## Features
> [!WARNING]  
> Currently, the bot only supports up to max. 25 devices on the rotom instance! If you have more devices, the messages are too long and the bot will fail.
- Only accepts interactions from users with a specific Discord role.
- Provides a simple status overview and detailed embeds for devices and their walkers, if enabled.
- Supports commands for device restart, reboot, logcat retrieval, and running Rotom jobs.
- Supports dragonite command to start quest re-scan for selected area.
- Supports dragonite command to either dis- or enable an area.
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
	"botAvatarUrl": "your-image-url-here",
	"rotom": {
		"address": "http://rotom:7072"
	},
	"dragonite": {
		"address":"http://dragoniteadm:7273",
		"password": "your-dragoniteAdmin-password-here",
		"username": "your-dragoniteAdmin-username-here"
	},
	"commandPermissionRole": "your-discord-role-id-goes-here",
	"deviceDetails": true,
	"workerDetails": true,
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
If `deviceDetails` or `workerDetails` is `true`, the bot will send a paginated message with detail-embeds for each device/worker when using `/device-status`.<br>
Values for `deviceCheckInterval` and `powerCycleAfterDeviceDowntime` are in minutes.

## Commands
- `/device-status`: Replies with status overview and detailed embeds for all devices and walkers.
- `/device-control action:restart/reboot`: Select one or all devices for restart or reboot.
- `/device-get-logcat`: Sends the logcat of a single device via DM.
- `/run-job`: Select a Rotom Job to run on a single or all devices (limited to the first 25 jobs of your Rotom instance).
- `/job-status`: Shows overall status for the latest Rotom jobs with detailed embeds for each job.
- `/area-quest-start`: Select an area from dragonite to start a quest rescan. Only works for the first 25 areas of your dragonite instance!
- `/area-control`: Enable or disable an area from dragonite. Only works for the first 25 areas of your dragonite instance!

## Device Alerts & Powercycle
If `enableDeviceCheck` is `true` and a time is set for `deviceCheckInterval`, the bot checks Rotom and device status on interval. Alerts are sent to `deviceAlertChannel`, mentioning `deviceAlertRole` if set. Power cycle requires device check to be enabled. If configured, the bot will search for the device origin of each offline device, and trigger the associated webhooks for power off and on.<br>
The old alert messages will be deleted in the same `deviceCheckInterval`, as new messages are send. So messages shouldn't pile up and all devices should be online, when no messages is present.

## Contribution
I am writing this bot in my spare time, for fun and to learn more about nodejs. So, this code will be far from being „good“ and needs every support it can get 🙃 please feel free to contribute in any way by opening a PR or creating an issue! 

## Open Tasks
- Test/optimize messages for many devices. Still limited to max 25 devices on rotom instance...
- Implement up to 5 job selection dropdowns (for more than 25 jobs/devices/areas etc.).
- Add more Dragonite commands

## Credits
Many thanks to UnownHash for creating Rotom (and Dragonite)! Obviously this bot is worthless without it.

Also a big thanks to nileplumb for his awesome icon repository [PkmnHomeIcons](https://github.com/nileplumb/PkmnHomeIcons), which I am using in this app.
