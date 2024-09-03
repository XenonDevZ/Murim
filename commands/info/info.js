const { EmbedBuilder } = require('discord.js');
const config = require('../../config'); // Load your config file

module.exports = {
		name: 'ping',
		description: 'Replies with the bot latency and API latency.',
		category: 'Info',
		run: async (client, message, args) => {
				// Send an initial message to get the latency
				const msg = await message.channel.send('Pinging...');

				// Create an embed with the bot and API latency
				const embed = new EmbedBuilder()
						.setColor(config.embedColor) // Use the color from your config file
						.setTitle('Pong! 🏓')
						.addFields(
								{ name: 'Bot Latency', value: `${msg.createdTimestamp - message.createdTimestamp}ms`, inline: true },
								{ name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
						)
						.setFooter({ text: 'Latency may vary based on your network.' });

				// Edit the initial message with the embed
				msg.edit({ content: null, embeds: [embed] });
		},
};
