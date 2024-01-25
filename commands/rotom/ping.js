const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time, hyperlink } = require('discord.js');
const { rotom } = require('../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {

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

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const restartAllYes = new ButtonBuilder()
			.setCustomId('yes')
			.setLabel('Yes')
			.setStyle(ButtonStyle.Danger);

		const selectDevice = new StringSelectMenuBuilder()
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

			selectDevice.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(rotomStatus.devices[dev].origin)
					.setDescription(deviceOnlineStatus)
					.setValue(rotomStatus.devices[dev].deviceId)
			);

		}

		const confirmRestart = new ActionRowBuilder()
			.addComponents( restartAllYes, cancel );



		const selectJob = new StringSelectMenuBuilder()
			.setCustomId('job')
			.setPlaceholder('Make a selection!')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Bulbasaur')
					.setDescription('The dual-type Grass/Poison Seed Pokémon.')
					.setValue('bulbasaur'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Charmander')
					.setDescription('The Fire-type Lizard Pokémon.')
					.setValue('charmander'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Squirtle')
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue('squirtle'),
			);

		const rowJob = new ActionRowBuilder()
			.addComponents(selectJob);

		const rowDevice = new ActionRowBuilder()
			.addComponents(selectDevice);

		const responseJob = await interaction.deferReply({ ephemeral: true });
		await wait(1_000);
		await interaction.editReply({
			content: 'Choose your Job!',
			components: [rowJob],
		});

		let selectedJob = "";
		let selectedDevice = "";
		let jobSelected = false;

		const collectorFilter = i => i.user.id === interaction.user.id;
		

		try {
			const confirmation = await responseJob.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });
			console.log("User selected job: ", confirmation.values[0]);
			selectedJob = confirmation.values[0];
			jobSelected = true;
			await interaction.deleteReply();


		} catch (e) {
			await interaction.editReply({ content: 'Confirmation not received within 3 minutes, cancelling', components: [] });
		}

		if (jobSelected){
			const responseDevice = await interaction.followUp({
				content: 'Choose your Device!',
				components: [rowDevice],
				ephemeral: true
			});

			try {
				const confirmationDevice = await responseDevice.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });
				console.log("User selected Device: ", confirmationDevice.values[0]);
				let selectedDeviceName = confirmationDevice.values[0];
				
				let selectionLabel = "all";

				if (selectedDeviceName != "all"){
					let selectedDevice = rotomStatus.devices.find(item => item.deviceId === selectedDeviceName);
					selectionLabel = selectedDevice.origin;
				}

				//await interaction.deleteReply();
				const userConfirmation = await interaction.followUp({ content: `⚠️ Are you sure, you want to run **${selectedJob} on ${selectionLabel}**?`, embeds: [], components: [ confirmRestart ], ephemeral: true });

				// Confirm Restart
				try {
					const restartUserConfirmation = await userConfirmation.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

					if (restartUserConfirmation.customId === 'yes') {
						console.log(`${restartUserConfirmation.user.username} confirmed!`)
						await restartUserConfirmation.deferReply({ ephemeral: true });
						await userConfirmation.deleteReply();
						//await restartUserConfirmation.deleteReply();

						//run job on device here
						if (selection === "all"){
							console.log("Looping all devices.");
							for (let dev = 0; dev < rotomStatus.devices.length; dev++) {
								console.log(`Perform action on ${rotomStatus.devices[dev].deviceId} now!`);

								try {
								    //let response = await fetch(rotom.address + '/api/device/' + rotomStatus.devices[dev].deviceId + '/action/' + action, {
									//    method: "POST"
									//});
								    if (!response.ok) {
								      	throw new Error("Network response was not OK");
								      }
								  } catch (error) {
								    console.error("There has been a problem with your fetch operation:", error);
								}							
							}
						} else {
							console.log(`Run job on ${selection} now!`);
							try {
							    //let response = await fetch(rotom.address + '/api/device/' + selection + '/action/' + action, {
								//    method: "POST"
								//});

							    if (!response.ok) {
							      	throw new Error("Network response was not OK");
							     }
							  } catch (error) {
							    console.error("There has been a problem with your fetch operation:", error);
							}							
						}
						console.log("Done with Job")
						await restartUserConfirmation.followUp({ content: `✅ Successfully started **${selectedJob} on ${selectionLabel}**!`, embeds: [], components: [], ephemeral: true })

					} else if (restartUserConfirmation.customId === 'cancel') {
						await restartUserConfirmation.update({ content: 'Action cancelled', embeds: [], components: [] });
					}

				} catch (e) {
					await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', embeds: [], components: [] });
				}




			} catch (e) {
				console.log(e);
				//await responseDevice.editReply({ content: 'Confirmation not received within 3 minutes, cancelling', components: [] });
			}
		}
	},
};
