const { EmbedBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    name: 'uptime',
    description: 'Displays the bot uptime using Discord timestamps.',
    category: "Utility",
    type: ApplicationCommandType.ChatInput, // Slash command type
    run: async (client, interaction) => {
        try {
            const uptime = client.uptime;
            const startTime = Date.now() - uptime;
            const timestamp = Math.floor(startTime / 1000);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Uptime')
                .setDescription(`The bot has been up since <t:${timestamp}:R>`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error executing 'uptime' command: ${error}`);
            await interaction.reply({ content: 'There was an error trying to execute that command!', ephemeral: true });
        }
    },
};
