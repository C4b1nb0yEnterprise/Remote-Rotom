const { EmbedBuilder, SlashCommandBuilder, time, hyperlink } = require('discord.js');
const { Pagination } = require('pagination.djs');
const { rotom, deviceDetails, workerDetails } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('device-status')
		.setDescription('Rotom Devices Status Overview'),
	async execute(interaction) {

		console.log(`User ${interaction.user.username} requested the device status.`);

		const paginationDevices = new Pagination(interaction, {
		    firstEmoji: '⏮', // First button emoji
		    prevEmoji: '◀️', // Previous button emoji
		    nextEmoji: '▶️', // Next button emoji
		    lastEmoji: '⏭', // Last button emoji
		    limit: 3, // number of entries per page
		    prevDescription: 'This is prev',
		    postDescription: 'This is post',
		    idle: 30000, // idle time in ms before the pagination closes
		    ephemeral: true, // ephemeral reply
		    loop: true // loop through the pages
		});

		const paginationWorker = new Pagination(interaction, {
		    firstEmoji: '⏮', // First button emoji
		    prevEmoji: '◀️', // Previous button emoji
		    nextEmoji: '▶️', // Next button emoji
		    lastEmoji: '⏭', // Last button emoji
		    limit: 3, // number of entries per page
		    prevDescription: 'This is prev',
		    postDescription: 'This is post',
		    idle: 5 * 60 * 1000, // idle time in ms before the pagination closes
		    ephemeral: true, // ephemeral reply
		    loop: true // loop through the pages
		});

		// get rotom device status
		const response = await fetch(rotom.address + "/api/status");
		const rotomStatus = await response.json();

		// build roto link
		const rotomLink = hyperlink('Rotom', rotom.address);
		
		// build device and worker ermbeds
		let deviceEmbeds = [];
		let workerEmbeds = [];
		let deviceOnlineCounter = 0;
		let workerOnlineCounter = 0;

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
				deviceOnlineCounter++
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
				//console.log(`Device ${rotomStatus.devices[i].origin} is offline`)
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
				workerOnlineCounter++
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
				//console.log(`Device ${rotomStatus.workers[i].workerId} is inactive`)
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
			workerEmbeds.push(deviceEmbed);

		}

		// send status message
		const message = `**Status Overview from ${rotomLink}**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}\nWorker online: ${workerOnlineCounter}/${rotomStatus.workers.length}`;
		await interaction.reply({content: message, ephemeral: true });

		if (!deviceDetails || deviceDetails !=false ) {
			paginationDevices.setEmbeds(deviceEmbeds, (embed, index, array) => {
			    return embed.setFooter({ text: `Page: ${index + 1}/${array.length}` });
			});
			paginationDevices.followUp();
		};

		if (!workerDetails && rotomStatus.workers.length || workerDetails !=false && rotomStatus.workers.length ) {
			paginationWorker.setEmbeds(workerEmbeds, (embed, index, array) => {
			    return embed.setFooter({ text: `Page: ${index + 1}/${array.length}` });
			});
			paginationWorker.followUp();
		};
	},
};
