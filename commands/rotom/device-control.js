const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time, hyperlink } = require('discord.js');
const { rotom } = require('../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('device-control')
		.setDescription(`Select a device and perform an action.`)
		.addStringOption(option => option.setName('action')
		.setDescription('Which action do you want to execute?')
		.setRequired(true)
		.addChoices(
			{ name: 'restart', value: 'restart' },
			{ name: 'reboot', value: 'reboot' },
		)),
	async execute(interaction) {

		const action = interaction.options.getString('action');
		console.log(`User ${interaction.user.username} requested a device ${action}.`);
		console.log(`User ${interaction.user.username} selected this action: `, action);

		// const target = interaction.options.getUser('target');
		// const reason = interaction.options.getString('reason') ?? 'No reason provided';

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

		// const restartAll = new ButtonBuilder()
		// 	.setCustomId('restart-all')
		// 	.setLabel('Restart all')
		// 	.setStyle(ButtonStyle.Danger);

		// const restartSelected = new ButtonBuilder()
		// 	.setCustomId('select-device')
		// 	.setLabel('Select Device')
		// 	.setStyle(ButtonStyle.Primary);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const restartAllYes = new ButtonBuilder()
			.setCustomId('yes')
			.setLabel('Yes')
			.setStyle(ButtonStyle.Danger);

		const deviceSelect = new StringSelectMenuBuilder()
			.setCustomId('device-to-execute')
			.setPlaceholder('Select a device')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel("All")
					.setDescription("Select all devices")
					.setValue("all")
			);
		
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

		const confirmRestart = new ActionRowBuilder()
			.addComponents( restartAllYes, cancel );

		const deviceSelectionMenu = new ActionRowBuilder()
			.addComponents( deviceSelect );

		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const responseInteraction = await interaction.reply({ 
			content: `**Which Device do you want to ${action}?**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, 
			components: [ deviceSelectionMenu ], 
			embeds: deviceEmbeds, 
			ephemeral: true 
		});

		const collectorFilter = i => i.user.id === interaction.user.id;

		// Get User Selection
		const collector = responseInteraction.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_000 });

		collector.on('collect', async i => {
			const selection = i.values[0];
			console.log(`${i.user.username} has selected ${selection}!`);

			let selectionLabel = "all";

			if (selection != "all"){
				let selectedDevice = rotomStatus.devices.find(item => item.deviceId === selection);
				selectionLabel = selectedDevice.origin;
			}
			
			const userConfirmation = await i.update({ content: `Are you sure, you want to **${action} ${selectionLabel}**?`, embeds: [], components: [ confirmRestart ] });

			// Confirm Restart
			try {
				const restartUserConfirmation = await userConfirmation.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

				if (restartUserConfirmation.customId === 'yes') {
					console.log(`${restartUserConfirmation.user.username} confirmed ${action}.`)
					await restartUserConfirmation.deferReply({ ephemeral: true });
					await interaction.deleteReply();
					//await restartUserConfirmation.deleteReply();

					//restart device here
					if (selection === "all"){
						console.log("Looping all devices.");
						for (let dev = 0; dev < rotomStatus.devices.length; dev++) {
							console.log(`Perform action on ${rotomStatus.devices[dev].deviceId} now!`);

							try {
							    let response = await fetch(rotom.address + '/api/device/' + rotomStatus.devices[dev].deviceId + '/action/' + action, {
								    method: "POST"
								});
							    if (!response.ok) {
							      	throw new Error("Network response was not OK");
							      }
							  } catch (error) {
							    console.error("There has been a problem with your fetch operation:", error);
							}							
						}
					} else {
						console.log(`${action} ${selection} now!`);
						console.log(`${rotom.address}/api/device/${selection}/action/${action}`);
						try {
						    let response = await fetch(rotom.address + '/api/device/' + selection + '/action/' + action, {
							    method: "POST"
							});
						    if (!response.ok) {
						      	throw new Error("Network response was not OK");
						     }
						  } catch (error) {
						    console.error("There has been a problem with your fetch operation:", error);
						}							
					}
					console.log("Done with " + action)
					await restartUserConfirmation.editReply({ content: `Successfully ${action}ed ${selectionLabel}!`, embeds: [], components: [], ephemeral: true })

				} else if (restartUserConfirmation.customId === 'cancel') {
					await restartUserConfirmation.update({ content: 'Action cancelled', embeds: [], components: [] });
				}

			} catch (e) {
				await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', embeds: [], components: [] });
			}
			
		});
	},
};
