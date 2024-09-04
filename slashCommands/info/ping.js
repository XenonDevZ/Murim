const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const config = require('../../config'); // Load your config file

module.exports = {
		name: 'ping',
		description: 'Replies with the bot latency and API latency.',
        category: "Info",
		type: ApplicationCommandType.ChatInput, // Use numeric value 1 for ChatInput (slash command)
		run: async (client, interaction) => {
				const msg = await interaction.reply({ content: 'Pinging...', fetchReply: true });

				const embed = new EmbedBuilder()
						.setColor(config.embedColor) // Use the color from your config file
						.setTitle('Pong! 🏓')
						.addFields(
								{ name: 'Bot Latency', value: `${msg.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
								{ name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
						)
						.setFooter({ text: 'Latency may vary based on your network.' });

				await interaction.editReply({ content: null, embeds: [embed] });
		},
};
