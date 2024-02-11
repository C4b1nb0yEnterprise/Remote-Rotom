const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, time, hyperlink } = require('discord.js');
const { dragonite } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('area-control')
		.setDescription('Dis- or enable a Dragonite area.')
		.addStringOption(option => option.setName('action')
			.setDescription('Which action do you want to execute?')
			.setRequired(true)
			.addChoices(
				{ name: '✅ enable', value: 'enable' },
				{ name: '⛔ disable', value: 'disable' },
			)
		),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true});

		const action = interaction.options.getString('action');
		console.log(`User ${interaction.user.username} requested to ${action} an area.`);


		//login to dragnite admin
		let loginData = {password: dragonite.password, username: dragonite.username};
		let login = await fetch(dragonite.address + "/auth/login", {
			method: "POST",
		  	credentials: "include",
		  	headers: {
		    	"Content-Type": "application/json"
		  	},
		  	body: JSON.stringify(loginData)
		}).then((res) => {
			let cookie = res.headers.getSetCookie();
			let token = cookie[0].split(';')
			//console.log(token[0]);
			return token;
		}).catch((error) => {
			console.log(error);
		});

		//console.log(login);

		// get areas
		let areas = await fetch(dragonite.address + "/api/areas/?order=DESC&sortBy=id", {
		  	credentials: "include",
		  	headers: {
		  		cookie: login
		  	}
		  }).then((res) => {
			return res.json();
		}).catch((error) => {
			console.log(error);
		});


		// create selections
		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const restartAllYes = new ButtonBuilder()
			.setCustomId('yes')
			.setLabel('Yes')
			.setStyle(ButtonStyle.Danger);

		const areaSelect = new StringSelectMenuBuilder()
			.setCustomId('area-to-rescan')
			.setPlaceholder('Select an area')

		let areaCounter = 0;
		for (let i=0; i< areas.data.length; i++){
		    //console.log(areas.data[i].name);
		    let areaEnabled = "⛔";
		    let areaDescription = "Disabled"
		    if (areas.data[i].enabled) {
		    	areaEnabled = "✅";
		    	areaDescription = "Enabled"
		    }

		    if ((action == "enable" && !areas.data[i].enabled) || (action == "disable" && areas.data[i].enabled)){
	    	    areaSelect.addOptions(
	    			new StringSelectMenuOptionBuilder()
	    				.setLabel(areas.data[i].name)
	    				.setDescription(areaDescription)
	    				.setValue(`${areas.data[i].id}`)
	    				.setEmoji(areaEnabled)
	    		);
	    		areaCounter++	
		    }

			if (areaCounter >= 25) {
				break;
			}
		};

		const confirmRestart = new ActionRowBuilder()
			.addComponents( restartAllYes, cancel );

		const areaSelectionMenu = new ActionRowBuilder()
			.addComponents( areaSelect );

		const areaSelection = await interaction.editReply({ content: `🏞 Please select the area to ${action}.`, components: [ areaSelectionMenu ] });

		// collect the selection if user matches original sender
		const collectorFilter = i => i.user.id === interaction.user.id;

		// Get User Selection
		const collector = areaSelection.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_000 });

		collector.on('collect', async i => {
			const selection = i.values[0];
			console.log(`${i.user.username} has selected Area ID ${selection} for ${action}!`);

			let selectionLabel = "none";

			if (selection){
				let selectedArea = areas.data.find(area => area.id == selection);
				selectionLabel = selectedArea.name;
			}

			// send user confirmation
			const userConfirmation = await i.update({ content: `⚠️ Are you sure, you want to **${action}** the area **${selectionLabel}**?`, embeds: [], components: [ confirmRestart ] });


			// Await confirmation and trigger action
			try {
				const restartUserConfirmation = await userConfirmation.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

				if (restartUserConfirmation.customId === 'yes') {
					console.log(`${restartUserConfirmation.user.username} confirmed ${action} for ${selectionLabel}.`)
					await restartUserConfirmation.deferReply({ ephemeral: true });
					await interaction.deleteReply();
					// send enable/disable area here
					try {
					    let response = await fetch(dragonite.address + '/api/areas/' + selection + '/' + action, {
						    credentials: "include",
						    headers: {
						    	cookie: login
						    }
						});
					    if (!response.ok) {
					      	throw new Error("Network response was not OK");
					     }
					    console.log(`Done with ${action} command.`)
					    await restartUserConfirmation.editReply({ content: `✅ Successfully **${action}d** area **${selectionLabel}**!`, embeds: [], components: [], ephemeral: true })

					  } catch (error) {
					    console.error("There has been a problem with your fetch operation:", error);
					    await restartUserConfirmation.editReply({ content: `❌ ${action} failed for area **${selectionLabel}**!`, embeds: [], components: [], ephemeral: true })

					}

				} else if (restartUserConfirmation.customId === 'cancel') {
					console.log(`${i.user.username} has cancelled the action!`)
					await restartUserConfirmation.update({ content: `❌ ${action} area cancelled`, embeds: [], components: [] });
				}
			} catch (e) {
				await interaction.editReply({ content: 'Confirmation not received within 3 minute, cancelling', embeds: [], components: [] });
			}
		});	
	},
};
