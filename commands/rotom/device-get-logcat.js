const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time, hyperlink, AttachmentBuilder } = require('discord.js');
const { rotom } = require('../../config.json');
const fetch = require('node-fetch')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('device-get-logcat')
		.setDescription("Sends device's logcat as DM"),
	async execute(interaction) {
		console.log(`User ${interaction.user.username} requested a device logcat.`);

		// Get Device infos
		const response = await fetch(rotom.address + "/api/status");
		const rotomStatus = await response.json();

		const rotomLink = hyperlink('Rotom', rotom.address);

		let deviceEmbeds = [];
		let deviceOnlineCounter = 0;

		// sort device array
		rotomStatus.devices.sort((a, b) => a.origin.localeCompare(b.origin))

		for (let i=0; i< rotomStatus.devices.length; i++){

			let lastMessageDate = time(Math.round(rotomStatus.devices[i].dateLastMessageReceived / 1000), 'R');
			let lastMessageSentDate = time(Math.round(rotomStatus.devices[i].dateLastMessageSent / 1000), 'R');
			
			let deviceEmbed = new EmbedBuilder()
			if (rotomStatus.devices[i].isAlive == true ) {
				deviceOnlineCounter++
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

		const deviceSelect = new StringSelectMenuBuilder()
			.setCustomId('device-to-execute')
			.setPlaceholder('Select a device')
		
		for (let dev = 0; dev < rotomStatus.devices.length; dev++){
			
			let deviceOnlineStatus = "Offline";
			if (rotomStatus.devices[dev].isAlive) {
				deviceOnlineStatus = "Online";
			}

			deviceSelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(rotomStatus.devices[dev].origin)
					.setDescription(deviceOnlineStatus)
					.setValue(rotomStatus.devices[dev].deviceId)
			);

		}

		const deviceSelectionMenu = new ActionRowBuilder()
			.addComponents( deviceSelect );

		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const responseInteraction = await interaction.reply({ 
			content: `**From which Device do you want the logcat?**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, 
			components: [ deviceSelectionMenu ], 
			embeds: deviceEmbeds, 
			ephemeral: true 
		});

		const collectorFilter = i => i.user.id === interaction.user.id;

		// Get User Selection
		const collector = responseInteraction.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_000 });

		collector.on('collect', async i => {
			const selection = i.values[0];
			let selectedDevice = rotomStatus.devices.find(item => item.deviceId === selection);
			console.log(`${i.user.username} has selected Device ${selectedDevice.origin}`);

			if (selectedDevice.isAlive != true) {

				await i.update({content: `Sorry, the device ${selectedDevice.origin} is offline ⛔\nRequesting Logcat wouldn't work... Please try another device 📱`, embeds: [], components: [], ephemeral: true });

			} else {

				await i.update({content: `Fetching 🪵🐱 from device **${selectedDevice.origin}** now!\nYou will receive a DM as soon as it is ready 👍`, embeds: [], components: [], ephemeral: true });

				// Get logcat here
				const logcatZip = await fetch(rotom.address + "/api/device/" + selectedDevice.deviceId + "/action/getLogcat", {
							    method: "POST"
							})
				const zipBuffer = await logcatZip.buffer();
				const attachment = new AttachmentBuilder(zipBuffer, { name: `logcat-${selectedDevice.origin}.zip` });
				console.log("Sending DM to ", interaction.user.username);
				await i.user.send({content: `Hey there!👋\nHere is your 🪵🐱 from device **${selectedDevice.origin}**.`, files: [attachment]});
				
			}
		});
	},
};
