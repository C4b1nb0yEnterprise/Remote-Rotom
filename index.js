const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes, Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { clientId, guildId, token, rotom, commandPermissionRole, deviceAlerts, botAvatarUrl } = require('./config.json');
const isReachable = require('is-reachable');
const { checkDeviceStatus } = require('./utilities/deviceAlert')

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Import commands from command folder
const commands = [];
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// When the client is ready
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(token);

	// Set client avatar
	if (botAvatarUrl){
		client.user.setAvatar(botAvatarUrl);
	}else{
		client.user.setAvatar('https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS/pokemon/479.png');
	}

	// and deploy your commands!
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			);

			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();

	// start device check if enabled
	if (deviceAlerts.enableDeviceCheck){
		console.log("Device check enabled!")
		let deviceAlertInterval = setInterval(checkDeviceStatus, deviceAlerts.deviceCheckInterval*60000, client );
	}
});

// When client receives interaction event
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	// check if user is allowed to execute commands, or send error message
	if (!interaction.member.roles.cache.has(commandPermissionRole)){
		console.log(`The user ${interaction.user.username}'s is not allowed to use Slash Commands.`);
		await interaction.reply({content: "Sorry, you are not allowed to use this Slash Command 😔", ephemeral: true });
		return
	}

	// check if Rotom is online, or send error message
	let rotomStatus = await isReachable(rotom.address, {timeout: 2000});
	if (rotomStatus == true){
		console.log("Rotom is online, processing reqeust...")
	} else {
		console.log("[WARNING] Rotom is offline! Cannot process request...")
		await interaction.reply({content: "Sorry, Rotom is unavailable right now! Cannot execute task 😔", ephemeral: true });
		return
	}

	// get command
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	// run command
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


// Log in to Discord with your client's token
client.login(token);
