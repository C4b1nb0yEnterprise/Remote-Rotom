const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time, hyperlink } = require('discord.js');
const { rotom } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('run-job')
		.setDescription('Select a device to run a job on.'),
	async execute(interaction) {
		console.log(`User ${interaction.user.username} requested a job execution.`);

		// get device status
		const response = await fetch(rotom.address + "/api/status");
		const rotomStatus = await response.json();

		// build embeds for devices and workers
		let deviceEmbeds = [];
		let deviceOnlineCounter = 0;

		// sort device array
		rotomStatus.devices.sort((a, b) => a.origin.localeCompare(b.origin));

		let overviewEmbeds = [];

		let onlineOverviewEmbed = new EmbedBuilder();
		onlineOverviewEmbed
			.setColor("Green")
			.setTitle(`✅ Devices online`)
			.setThumbnail('https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/1.png')
			.setTimestamp()
		let offlineOverviewEmbed = new EmbedBuilder(); 
		offlineOverviewEmbed
			.setColor("Red")
			.setTitle(`⛔ Devices offline`)
			.setThumbnail('https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/device/0.png')
			.setTimestamp()

		for (let i=0; i< rotomStatus.devices.length; i++){

			let lastMessageDate = time(Math.round(rotomStatus.devices[i].dateLastMessageReceived / 1000), 'R');
			let lastMessageSentDate = time(Math.round(rotomStatus.devices[i].dateLastMessageSent / 1000), 'R');
			
			let deviceEmbed = new EmbedBuilder()
			if (rotomStatus.devices[i].isAlive == true ) {
				deviceOnlineCounter++
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

				onlineOverviewEmbed
					.addFields({ name: `📱 Device ${rotomStatus.devices[i].origin}`, value: `received: ${lastMessageDate}\nsend: ${lastMessageSentDate}`, inline: true});

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

				offlineOverviewEmbed
					.addFields({ name: `📱 Device ${rotomStatus.devices[i].origin}`, value: `received: ${lastMessageDate}\nsend: ${lastMessageSentDate}`, inline: true});
			}
			deviceEmbeds.push(deviceEmbed);

		}


		const selectJob = new StringSelectMenuBuilder()
			.setCustomId('job')
			.setPlaceholder('Select a job');
			

		// Get Job List
		const responseJobList = await fetch(rotom.address + "/api/job/list");
		const rotomJobList = await responseJobList.json();

		let jobCounter = 0;
		let jobIdList = [];
		// Add each job as selection option
		for (const job in rotomJobList) {
			if (rotomJobList.hasOwnProperty(job)) {
				selectJob.addOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel(rotomJobList[job].id)
						.setDescription(rotomJobList[job].description)
						.setValue(rotomJobList[job].id)
				);
				jobCounter++
				jobIdList.push(rotomJobList[job].id);
				// Discord limits the selection dropdown to 25
				if (jobCounter >= 25) {
					break;
				}
			}
		}

		const jobSelect = new ActionRowBuilder()
			.addComponents(selectJob);

		// build device selection
		const selectDevice = new StringSelectMenuBuilder()
			.setCustomId('device')
			.setPlaceholder('Select a device')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel("All")
					.setDescription("Select all devices")
					.setValue("all")
			);
		// Add each device as selection option
		let deviceCounter = 0;
		for (let dev = 0; dev < rotomStatus.devices.length; dev++){
			
			let deviceOnlineStatus = "Offline";
			let deviceEmoji = "⛔";
			if (rotomStatus.devices[dev].isAlive) {
				deviceOnlineStatus = "Online";
				deviceEmoji = "✅";
			}

			selectDevice.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(rotomStatus.devices[dev].origin)
					.setDescription(deviceOnlineStatus)
					.setValue(rotomStatus.devices[dev].deviceId)
					.setEmoji(deviceEmoji)
			);
			deviceCounter++
			if (deviceCounter >= 25) {
				break;
			}
		}


		const deviceSelect = new ActionRowBuilder()
			.addComponents(selectDevice);


		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const restartAllYes = new ButtonBuilder()
			.setCustomId('yes')
			.setLabel('Yes')
			.setStyle(ButtonStyle.Danger);

		const confirmRestart = new ActionRowBuilder()
			.addComponents( restartAllYes, cancel );


		if (deviceOnlineCounter != 0) {
			overviewEmbeds.push(onlineOverviewEmbed);
		}
		if (deviceOnlineCounter < rotomStatus.devices.length){
			overviewEmbeds.push(offlineOverviewEmbed);
		}

		// send job selection
		const responseJobSelect = await interaction.reply({
			content: `**Please select a Job to run.**\nOnly shows first 25 jobs of your instance.`, 
			components: [ jobSelect ],
			ephemeral: true 
		});

		// filter for all selections
		const collectorFilterJob = i => i.user.id === interaction.user.id && i.customId === 'job';
		const collectorFilterDevice = i => i.user.id === interaction.user.id && i.customId === 'device';
		const collectorFilterConfirm = i => i.user.id === interaction.user.id && i.customId === 'yes' || i.user.id === interaction.user.id && i.customId === 'cancel';

		const collectorJobSelect = responseJobSelect.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter: collectorFilterJob, time: 3_600_000 });
		const collectorDeviceSelect = responseJobSelect.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter: collectorFilterDevice, time: 3_600_000 });

		let selectionJob = "";
		let selectionDevice = "";

		// collect job selection
		collectorJobSelect.on('collect', async i => {
			selectionJob = i.values[0];
			console.log(`${i.user} has selected Job ${selectionJob}!`);
			await i.update({content: `**Please select one or all Device.**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, components: [deviceSelect], embeds: overviewEmbeds, ephemeral: true });
		});

		// collect device selection
		collectorDeviceSelect.on('collect', async i => {
			selectionDevice = i.values[0];
			console.log(`${i.user} has selected Device ${selectionDevice}!`);

			let selectionLabel = "all Devices";
			let selectedDevice = "";
			if (selectionDevice != "all"){
				selectedDevice = rotomStatus.devices.find(item => item.deviceId === selectionDevice);
				selectionLabel = selectedDevice.origin;
			}

			// check if device is online, else notify user
			if (selectedDevice.isAlive === false){
				const userConfirmation = await i.update({ content: `Sorry, the device ${selectedDevice.origin} is offline ⛔\nRunning jobs wouldn't work... Please try another device 📱`, embeds: [], components: [] });
				return	
			}
			
			// request user confirmation
			const userConfirmation = await i.update({ content: `⚠️ Are you sure, you want to run **${selectionJob}** on **${selectionLabel}**?`, embeds: [], components: [ confirmRestart ] });

			const restartUserConfirmation = await userConfirmation.awaitMessageComponent({ filter: collectorFilterConfirm, time: 180_000 });
			if (restartUserConfirmation.customId === "yes"){
				console.log(`User ${interaction.user.username} confirmed!`);
				
				if (selectionDevice === "all"){
					let allDeviceIds = [];
					// Run Job for all devices
					console.log("Looping all devices.");
					for (let dev = 0; dev < rotomStatus.devices.length; dev++) {
						allDeviceIds.push(rotomStatus.devices[dev].deviceId);
					}

					try {
					    let response = await fetch(rotom.address + '/api/job/execute/' + selectionJob, {
						    method: "POST",
						    headers: {
						          'Accept': 'application/json',
						          'Content-Type': 'application/json'
						        },
						    body: JSON.stringify({deviceIdsOrOrigins: allDeviceIds})
						});
					    if (!response.ok) {
					    	console.log(response);
					      	throw new Error("Network response was not OK");
					      }
					  } catch (error) {
					    console.error("There has been a problem with your fetch operation:", error);
					}							

				} else {
					// Run Job on selected devices
					console.log(`Run ${selectionJob} on ${selectedDevice.origin} now!`);
					try {
					    let response = await fetch(rotom.address + '/api/job/execute/' + selectionJob, {
						    method: "POST",
						    headers: {
						          'Accept': 'application/json',
						          'Content-Type': 'application/json'
						        },
						    body: JSON.stringify({deviceIdsOrOrigins: [selectedDevice.origin]})
						});
					    if (!response.ok) {
					      	throw new Error("Network response was not OK");
					     }
					  } catch (error) {
					    console.error("There has been a problem with your fetch operation:", error);
					}	
				}

				await i.editReply({ content: `✅ Successfully ran **${selectionJob}** on **${selectionLabel}**!`, embeds: [], components: [] })

			} else if (restartUserConfirmation.customId === "cancel"){
				console.log("He said no...");
				await i.editReply({ content: '❌ Job execution cancelled', embeds: [], components: [] });
			}

		});



	},
};
