const { rotom, deviceAlerts } = require('../config.json');
const wait = require('node:timers/promises').setTimeout;
const { EmbedBuilder, SlashCommandBuilder, time } = require('discord.js');
const isReachable = require('is-reachable');

async function checkDeviceStatus (client){

	// check if alert channel was provided 
	if (!deviceAlerts.deviceAlertChannel){
		console.log("No channel in config. Not gonna send anything.");
		return;
	}

	// get device status
	console.log("Checking Device Status...");
	// test if rotom is online, or send alert message
	let rotomPing = await isReachable(rotom.address, {timeout: 2000});
	if (rotomPing == true){
		console.log("Rotom is online.")
	} else {
		console.log("[WARNING] Rotom is offline! Cannot process request...")
		let messageRotomDown = "";
		if (deviceAlerts.deviceAlertRole){
			messageRotomDown = `**⚠️ Attention <@&${deviceAlerts.deviceAlertRole}>! Rotom is offline!**\nCannot process commands or check status 😔`;
		} else {
			messageRotomDown = `**⚠️ Attention! Rotom is offline!**\nCannot process commands or check status 😔`;
		}
		await client.channels.cache.get(deviceAlerts.deviceAlertChannel).send({content: messageRotomDown, ephemeral: true });
		return
	}

	// fetch device status
	const response = await fetch(rotom.address + "/api/status");
	const rotomStatus = await response.json();
	

	// Setup embeds for devices and workers
	let deviceEmbeds = [];
	let deviceOfflineCounter = 0;
	let workerOfflineCounter = 0;

	// sort device array
	rotomStatus.devices.sort((a, b) => a.origin.localeCompare(b.origin))
	// sort worker array
	rotomStatus.workers.sort((a, b) => a.workerId.localeCompare(b.workerId))

	for (let i=0; i< rotomStatus.devices.length; i++){

		let lastMessageDate = time(Math.round(rotomStatus.devices[i].dateLastMessageReceived / 1000), 'R');
		let lastMessageSentDate = time(Math.round(rotomStatus.devices[i].dateLastMessageSent / 1000), 'R');
		
		let deviceEmbed = new EmbedBuilder()
		if (rotomStatus.devices[i].isAlive == true ) {
			//console.log(`Device ${rotomStatus.devices[i].origin} is alive`);
			deviceEmbed
				.setColor("Green")
				.setTitle(`✅ ${rotomStatus.devices[i].origin} is online`)
				.addFields({ name: '📱 Device ID', value: rotomStatus.devices[i].deviceId, inline: false })
				.addFields({ name: '📥 Last Message Received', value: lastMessageDate, inline: false })
				.addFields({ name: '📤 Last Message Sent', value: lastMessageSentDate, inline: false })
				.setThumbnail('https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/1.png')
				.setTimestamp()
				.setFooter({ text: rotomStatus.devices[i].origin, iconURL: 'https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/1.png' });
		} else {
			console.log(`Device ${rotomStatus.devices[i].origin} is offline`)
			deviceOfflineCounter++
			deviceEmbed
				.setColor("Red")
				.setTitle(`⛔ ${rotomStatus.devices[i].origin} is offline`)
				.addFields({ name: '📱 Device ID', value: rotomStatus.devices[i].deviceId, inline: false })
				.addFields({ name: '📥 Last Message Received', value: lastMessageDate, inline: false })
				.addFields({ name: '📤 Last Message Sent', value: lastMessageSentDate, inline: false })
				.setThumbnail('https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/0.png')
				.setTimestamp()
				.setFooter({ text: rotomStatus.devices[i].origin, iconURL: 'https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/1.png' });
		}
		deviceEmbeds.push(deviceEmbed);

	}

	for (let i=0; i< rotomStatus.workers.length; i++){

		let lastMessageDate = time(Math.round(rotomStatus.workers[i].worker.dateLastMessageReceived / 1000), 'R');
		let lastMessageSentDate = time(Math.round(rotomStatus.workers[i].worker.dateLastMessageSent / 1000), 'R');
		
		let deviceEmbed = new EmbedBuilder()
		if (rotomStatus.workers[i].worker.isAlive == true && rotomStatus.workers[i].isAllocated == true ) {
			//console.log(`Device ${rotomStatus.workers[i].workerId} is active`);
			deviceEmbed
				.setColor("Grey")
				.setTitle(`🛠️ ${rotomStatus.workers[i].workerId} is active`)
				.addFields({ name: '🧰 Active Task', value: rotomStatus.workers[i].controller.workerName, inline: false })
				.addFields({ name: '📱 Parent Device ID', value: rotomStatus.workers[i].deviceId, inline: false })
				.addFields({ name: '📥 Last Message Received', value: lastMessageDate, inline: false })
				.addFields({ name: '📤 Last Message Sent', value: lastMessageSentDate, inline: false })
				.setTimestamp()
				.setFooter({ text: rotomStatus.workers[i].workerId, iconURL: 'https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/misc/grass.png' });
		} else {
			console.log(`Device ${rotomStatus.workers[i].workerId} is inactive`)
			workerOfflineCounter++
			deviceEmbed
				.setColor("Orange")
				.setTitle(`😴 ${rotomStatus.workers[i].workerId} is inactive`)
				.addFields({ name: '📱 Parent Device ID', value: rotomStatus.workers[i].deviceId, inline: false })
				.addFields({ name: '📥 Last Message Received', value: lastMessageDate, inline: false })
				.addFields({ name: '📤 Last Message Sent', value: lastMessageSentDate, inline: false })
				.setThumbnail('https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/0.png')
				.setTimestamp()
				.setFooter({ text: rotomStatus.workers[i].workerId, iconURL: 'https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/misc/grass.png' });
		}
		deviceEmbeds.push(deviceEmbed);

	}

	// send alert message, if devices or worker are offline
	if (deviceOfflineCounter > 0 || workerOfflineCounter > 0) {
		console.log("... devices offline. Gonna send an alert message!")
		let message = "";
		if (deviceAlerts.deviceAlertRole){
			message = `**⚠️ Attention <@&${deviceAlerts.deviceAlertRole}>! One or more Devices or Worker are offline!**\nDevices offline: ${deviceOfflineCounter}/${rotomStatus.devices.length}\nWorker offline: ${workerOfflineCounter}/${rotomStatus.workers.length}`;
		} else {
			message = `**⚠️ Attention! One or more Devices or Worker are offline!**\nDevices offline: ${deviceOfflineCounter}/${rotomStatus.devices.length}\nWorker offline: ${workerOfflineCounter}/${rotomStatus.workers.length}`;
		}
		const alertMessage = await client.channels.cache.get(deviceAlerts.deviceAlertChannel).send({content: message, embeds: deviceEmbeds});
	} else {
		console.log("...all good! noting to do.");
	}

	// check if powercycle is enabled
	if (deviceAlerts.enablePowerCycle){
		//check for each offline device if downtime passed
		for (let i=0; i< rotomStatus.devices.length; i++){
			if (rotomStatus.devices[i].isAlive === false && Math.round( new Date() - rotomStatus.devices[i].dateLastMessageReceived) >= deviceAlerts.powercylceAfterDeviceDowntime * 60000 ) {
				// if device are set in config, search for a matching device origin and trigger the powercycle webhooks
				if (deviceAlerts.devices.length > 0){
					let rebootDeviceData = deviceAlerts.devices.find(item => item.origin === rotomStatus.devices[i].origin);
					if (rebootDeviceData) {
						console.log("Found the origin in the config!");
						if (rebootDeviceData.webhookPowerOff && rebootDeviceData.webhookPowerOn) {
							console.log(`Trigger Recycle for device ${rotomStatus.devices[i].origin} now`);
							const powercycleMessage = await client.channels.cache.get(deviceAlerts.deviceAlertChannel).send({content: `**⚠️ Attention <@&${deviceAlerts.deviceAlertRole}>!**\nDevice **${rotomStatus.devices[i].origin}** hasn't send data since **${time(Math.round(rotomStatus.devices[i].dateLastMessageReceived / 1000), 'R')}**. Will trigger powercycle now!`});
							await fetch(rebootDeviceData.webhookPowerOff);
							await wait(5_000);
							await fetch(rebootDeviceData.webhookPowerOn);
						} else {
							console.log("No power-cycle setup present for this device.")
						}
					}
				}			
			}
		}
	}

	return
}

module.exports =  { checkDeviceStatus };