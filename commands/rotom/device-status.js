const { EmbedBuilder, SlashCommandBuilder, time, hyperlink } = require('discord.js');
const { rotom } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('device-status')
		.setDescription('Rotom Devices Status Overview'),
	async execute(interaction) {

		console.log(`User ${interaction.user.username} requested the device status.`);

		const response = await fetch(rotom.address + "/api/status");
		const rotomStatus = await response.json();

		const rotomLink = hyperlink('Rotom', rotom.address);
		const message = `Devices Status Overview from ${rotomLink}`;

		let deviceEmbeds = [];

		// sort device array
		rotomStatus.devices.sort((a, b) => a.origin.localeCompare(b.origin))
		// sort worker array
		rotomStatus.workers.sort((a, b) => a.workerId.localeCompare(b.workerId))

		for (let i=0; i< rotomStatus.devices.length; i++){

			let lastMessageDate = time(Math.round(rotomStatus.devices[i].dateLastMessageReceived / 1000), 'R');
			let lastMessageSentDate = time(Math.round(rotomStatus.devices[i].dateLastMessageSent / 1000), 'R');
			
			let deviceEmbed = new EmbedBuilder()
			if (rotomStatus.devices[i].isAlive == true ) {
				console.log(`Device ${rotomStatus.devices[i].origin} is alive`);
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
				console.log(`Device ${rotomStatus.workers[i].workerId} is active`);
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

		//console.log(deviceEmbeds);
		await interaction.reply({content: message, embeds: deviceEmbeds, ephemeral: true });
	},
};
