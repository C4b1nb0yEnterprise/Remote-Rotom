const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time, hyperlink } = require('discord.js');
const { rotom } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('run-job')
		.setDescription('Select a device to run a job on.'),
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
				console.log(`Found Job ${rotomJobList[job].id}`);
				selectJob.addOptions(
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

		const jobSelect = new ActionRowBuilder()
			.addComponents(selectJob);

		const selectDevice = new StringSelectMenuBuilder()
			.setCustomId('device')
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

		//await interaction.deferReply()
		//await interaction.deferReply();
		const responseJobSelect = await interaction.reply({
			content: `**Please select a Job to run.**\nOnly shows first 25 jobs of your instance.`, 
			components: [ jobSelect ],
			ephemeral: true 
		});

		const collectorFilterJob = i => i.user.id === interaction.user.id && i.customId === 'job';
		const collectorFilterDevice = i => i.user.id === interaction.user.id && i.customId === 'device';
		const collectorFilterConfirm = i => i.user.id === interaction.user.id && i.customId === 'yes' || i.user.id === interaction.user.id && i.customId === 'cancel';

		const collectorJobSelect = responseJobSelect.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter: collectorFilterJob, time: 3_600_000 });
		const collectorDeviceSelect = responseJobSelect.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter: collectorFilterDevice, time: 3_600_000 });

		let selectionJob = "";
		let selectionDevice = "";

		collectorJobSelect.on('collect', async i => {
			selectionJob = i.values[0];
			console.log(`${i.user} has selected Job ${selectionJob}!`);
			await i.update({content: `**Please select one or all Device.**\nDevices online: ${deviceOnlineCounter}/${rotomStatus.devices.length}`, components: [deviceSelect], embeds: deviceEmbeds, ephemeral: true });
		});

		collectorDeviceSelect.on('collect', async i => {
			selectionDevice = i.values[0];
			console.log(`${i.user} has selected Device ${selectionDevice}!`);

			let selectionLabel = "all Devices";

			if (selectionDevice != "all"){
				let selectedDevice = rotomStatus.devices.find(item => item.deviceId === selectionDevice);
				selectionLabel = selectedDevice.origin;
			}

			const userConfirmation = await i.update({ content: `⚠️ Are you sure, you want to run **${selectionJob}** on **${selectionLabel}**?`, embeds: [], components: [ confirmRestart ] });

			const restartUserConfirmation = await userConfirmation.awaitMessageComponent({ filter: collectorFilterConfirm, time: 180_000 });
			if (restartUserConfirmation.customId === "yes"){
				console.log("He said yes!");
				await i.editReply({ content: `✅ Successfully ran **${selectionJob}** on **${selectionLabel}**!`, embeds: [], components: [], ephemeral: true })

			} else if (restartUserConfirmation.customId === "cancel"){
				console.log("He said no...");
				await i.editReply({ content: 'Job Execution cancelled', embeds: [], components: [] });
			}

		});



	},
};
