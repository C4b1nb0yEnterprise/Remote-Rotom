const { EmbedBuilder, SlashCommandBuilder, time, hyperlink } = require('discord.js');
const { rotom } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('job-status')
		.setDescription('Rotom Job Status Overview'),
	async execute(interaction) {

		console.log(`User ${interaction.user.username} requested the job status.`);

		const response = await fetch(rotom.address + "/api/job/status");
		const rotomJobStatus = await response.json();

		console.log(rotomJobStatus);

		const rotomLink = hyperlink('Rotom', rotom.address);
		
		let jobsEmbeds = [];
		let jobsActiveCounter = 0;
		let jobCounter = 0;

		// sort device array
		//rotomJobStatus.devices.sort((a, b) => a.origin.localeCompare(b.origin))
			

		for (const job in rotomJobStatus) {
		if (rotomJobStatus.hasOwnProperty(job)) {
			console.log(`Found Job ${rotomJobStatus[job].jobId}`);
			let jobsEmbed = new EmbedBuilder()

			if (rotomJobStatus[job].executionComplete == false ){
				jobsActiveCounter++
				jobsEmbed
					.setColor("Blue")
					.setTitle(`⏱️ ${rotomJobStatus[job].jobId} is processing...`)
					.addFields({ name: '📱 Device ID', value: rotomJobStatus[job].deviceOrigin, inline: false })
					.addFields({ name: '🧰 Job', value: rotomJobStatus[job].jobId, inline: false })
					.setThumbnail()
					.setTimestamp()
					.setFooter({ text: `${rotomJobStatus[job].jobId} @ 📱${rotomJobStatus[job].deviceOrigin}`});
			} else  if (rotomJobStatus[job].success) {
				console.log(`Job ${rotomJobStatus[job].jobId} completed successfully.`)
				jobsEmbed
					.setColor("Green")
					.setTitle(`✅ ${rotomJobStatus[job].jobId} completed successfully!`)
					.addFields({ name: '📱 Device ID', value: rotomJobStatus[job].deviceOrigin, inline: false })
					.addFields({ name: '🧰 Job', value: rotomJobStatus[job].jobId, inline: false });
					
				if (rotomJobStatus[job].result){
					jobsEmbed.addFields({ name: '📝 Results', value: rotomJobStatus[job].result, inline: false });
				}

				jobsEmbed
					.setThumbnail()
					.setTimestamp()
					.setFooter({ text: `${rotomJobStatus[job].jobId} @ 📱${rotomJobStatus[job].deviceOrigin}`});
			} else {
				console.log(`Job ${rotomJobStatus[job].jobId} is done but failed`)
				jobsEmbed
					.setColor("Red")
					.setTitle(`❗${rotomJobStatus[job].jobId} failed!`)
					.addFields({ name: '📱 Device ID', value: rotomJobStatus[job].deviceOrigin, inline: false })
					.addFields({ name: '🧰 Job', value: rotomJobStatus[job].jobId, inline: false })
					.addFields({ name: '📝 Results', value: rotomJobStatus[job].result, inline: false });

				if (rotomJobStatus[job].result){
					jobsEmbed.addFields({ name: '📝 Results', value: rotomJobStatus[job].result, inline: false });
				}
				jobsEmbed
					.setThumbnail()
					.setTimestamp()
					.setFooter({ text: `${rotomJobStatus[job].jobId} @ 📱${rotomJobStatus[job].deviceOrigin}`});
			}

				jobsEmbeds.push(jobsEmbed);

			}

			jobCounter++;
			if (jobCounter >= 25) {
				break;
			}
		}


		//console.log(jobsEmbeds);
		const message = `**Status Overview from ${rotomLink}**\nJobs active: ${jobsActiveCounter}/${jobCounter}`;
		await interaction.reply({content: message, embeds: jobsEmbeds, ephemeral: true });
	},
};
