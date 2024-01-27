const { rotom } = require('../config.json');
const { EmbedBuilder, SlashCommandBuilder, time } = require('discord.js');

async function checkDeviceStatus (client, deviceAlertChannel, alertRole, deviceCheckInterval){
	if (!deviceAlertChannel){
		console.log("No channel in config. Not gonna send anything.");
		return;
	}

	if (alertRole){
		console.log("This role needs to be mentioned: ", alertRole);
	}

	console.log("Checking Device Status...");

	const response = await fetch(rotom.address + "/api/status");
	const rotomStatus = await response.json();
	
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

	if (deviceOfflineCounter > 0 || workerOfflineCounter > 0) {
		let message = "";
		if (alertRole){
			message = `**⚠️ Attention <@&${alertRole}>! One or more Devices or Worker are offline!**\nDevices offline: ${deviceOfflineCounter}/${rotomStatus.devices.length}\nWorker offline: ${workerOfflineCounter}/${rotomStatus.workers.length}`;
		} else {
			message = `**⚠️ Attention! One or more Devices or Worker are offline!**\nDevices offline: ${deviceOfflineCounter}/${rotomStatus.devices.length}\nWorker offline: ${workerOfflineCounter}/${rotomStatus.workers.length}`;
		}
		const alertMessage = await client.channels.cache.get(deviceAlertChannel).send({content: message, embeds: deviceEmbeds});
	} else {
		console.log("...all good! noting to do.");
	}
	return
}

module.exports =  { checkDeviceStatus };