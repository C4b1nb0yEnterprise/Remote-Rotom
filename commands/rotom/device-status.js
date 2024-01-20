const { SlashCommandBuilder } = require('discord.js');
const { rotom } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('device-status')
		.setDescription('Rotom Devices Status Overview'),
	async execute(interaction) {
		const response = await fetch(rotom.address + "/api/status");
		const rotomStatus = await response.json();
		console.log(`User ${interaction.user.username} requested the device status.`);

		let message = "These devices are alive: ";

		for (let i=0; i< rotomStatus.devices.length; i++){
			if (rotomStatus.devices[i].isAlive === true) {
				message += rotomStatus.devices[i].origin + " | "
			}

		}

		await interaction.reply({content: message, ephemeral: true });
	},
};
