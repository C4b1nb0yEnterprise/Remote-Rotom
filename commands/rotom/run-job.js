const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time } = require('discord.js');
const { rotom } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('run-job')
		.setDescription(`Select a device to run a job on.`),
	async execute(interaction) {
		console.log(`User ${interaction.user.username} requested a job execution.`);

		const response = await fetch(rotom.address + "/api/status");
		const rotomStatus = await response.json();

		let deviceEmbeds = [];
		let deviceOnlineCounter = 0;

		// sort device array
		rotomStatus.devices.sort((a, b) => a.origin.localeCompare(b.origin));

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

		const confirmJob = new ButtonBuilder()
			.setCustomId('yes')
			.setLabel('Yes')
			.setStyle(ButtonStyle.Danger);

		const jobSelect = new StringSelectMenuBuilder()
			.setCustomId('job-to-run')
			.setPlaceholder('Select a job')

		// Get Job List
		const responseJobList = await fetch(rotom.address + "/api/job/list");
		const rotomJobList = await responseJobList.json();

		let jobCounter = 0;
		let jobIdList = [];
		// Add each job as selection option
		for (const job in rotomJobList) {
			if (rotomJobList.hasOwnProperty(job)) {
				console.log(`Found Job ${rotomJobList[job].id}`);
				jobSelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(rotomJobList[job].id)
					.setDescription(rotomJobList[job].description)
					.setValue(rotomJobList[job].id)
				);
				jobCounter++
				jobIdList.push(rotomJobList[job].id);
				if (jobCounter >= 25) {
					break;
				}
			}
		}

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

		const confirmJobExecution = new ActionRowBuilder()
			.addComponents( confirmJob, cancel );

		const deviceSelectionMenu = new ActionRowBuilder()
			.addComponents( deviceSelect );

		const jobSelectionMenu = new ActionRowBuilder()
			.addComponents( jobSelect );

		// Get Job selection
		const responseJobInteraction = await interaction.reply({ 
			content: `**Please select Job and Device to run?**\nOnly shows first 25 jobs of your instance.\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, 
			components: [ jobSelectionMenu, deviceSelectionMenu ],
			embeds: deviceEmbeds, 
			ephemeral: true 
		});

		const collectorFilter = i => i.user.id === interaction.user.id;

		// Get User Device Selection
		const collectorJob = responseJobInteraction.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_000 });

		collectorJob.on('collect', async j => {
			const selectedJob = j.values[0];
			const selectedDevice = j.values[1];
			console.log(`${j.user.username} has selected ${selectedJob} on ${selectedDevice} !`);

			// if (jobIdList.includes(selection)){
			// 	console.log("Job was selected!");
			// 	let selectedJob = selection;

			// 	await interaction.editReply({ 
			// 		content: `**On which Device do you want to run the job?**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, 
			// 		components: [ deviceSelectionMenu ], 
			// 		embeds: deviceEmbeds, 
			// 		ephemeral: true 
			// 	});
			// }

			if (selectedDevice === "all" || rotomStatus.devices.find(item => item.deviceId === selectedDevice)){
				let selectionLabel = "all devices";

				if (selectedDevice != "all"){
					let selectedDevice = rotomStatus.devices.find(item => item.deviceId === selectedDevice);
					selectionLabel = selectedDevice.origin;
				}

				////////////////////////////////////////////////
				/////// Seems to work up until here... WIP /////
				////////////////////////////////////////////////

				// Confirmation Flow
				const userConfirmation = await j.editReply({ content: `⚠️ Are you sure, you want to run **${selectedJob}** on **${selectionLabel}**?`, embeds: [], components: [ confirmJobExecution ] });

				// Confirm Job
				try {
					const userConfirmation = await userConfirmation.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

					if (userConfirmation.customId === 'yes') {
						console.log(`${userConfirmation.user.username} confirmed!`)
						await userConfirmation.deferReply({ ephemeral: true });
						await interaction.deleteReply();
						//await userConfirmation.deleteReply();

						//restart device here
						if (selectedDevice === "all"){
							console.log("Looping all devices.");
							for (let dev = 0; dev < rotomStatus.devices.length; dev++) {
								console.log(`Run Job on ${rotomStatus.devices[dev].deviceId} now!`);

								try {
								    let response = await fetch(rotom.address + '/api/job/execute/' + selectedJob, {
									    method: "POST",
									    body: JSON.stringify({deviceIdsOrOrigins: [ rotomStatus.devices[dev].deviceId ]})
									});
								    if (!response.ok) {
								      	throw new Error("Network response was not OK");
								      }
								  } catch (error) {
								    console.error("There has been a problem with your fetch operation:", error);
								}							
							}
						} else {
							console.log(`Run Job on ${selectedDevice} now!`);

							try {
							    let response = await fetch(rotom.address + '/api/job/execute/' + jobSelected, {
								    method: "POST",
								    body: JSON.stringify({deviceIdsOrOrigins: [ selectedDevice ]})
								});
							    if (!response.ok) {
							      	throw new Error("Network response was not OK");
							     }
							  } catch (error) {
							    console.error("There has been a problem with your fetch operation:", error);
							}							
						}
						console.log("Done executing jobs! ");
						await userConfirmation.editReply({ content: `✅ Successfully ran **${selectedJob}** on **${selectionLabel}**!`, embeds: [], components: [], ephemeral: true })

					} else if (userConfirmation.customId === 'cancel') {
						await userConfirmation.update({ content: 'Action cancelled', embeds: [], components: [] });
					}

				} catch (e) {
					await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', embeds: [], components: [] });
				}
			}

			// Get Device Selection
			// const responseInteraction = await interaction.editReply({ 
			// 	content: `**On which Device do you want to run the job?**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, 
			// 	components: [ deviceSelectionMenu ], 
			// 	embeds: deviceEmbeds, 
			// 	ephemeral: true 
			// });

			// Get User Device Selection
			// const collector = responseInteraction.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_000 });

			// collector.on('collect', async i => {
			// 	const selection = i.values[0];
			// 	console.log(`${i.user.username} has selected Device ${selection}!`);

				
			// });	
		});		
	}
};
