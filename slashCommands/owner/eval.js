const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const { inspect } = require('util');
const paginate = require('../../utils/paginate');

module.exports = {
    name: 'eval',
    description: 'Evaluates JavaScript code.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'code',
            type: 3, // 3 indicates a STRING type
            description: 'The JavaScript code to evaluate.',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const ownerID = client.config?.ownerId;

        // Check if the user is the bot owner
        if (interaction.user.id !== ownerID) {
            return interaction.reply({ content: 'This command is restricted to the bot owner.', ephemeral: true });
        }

        const code = interaction.options.getString('code');

        try {
            let evaled = eval(code);

            if (typeof evaled !== 'string') {
                evaled = inspect(evaled, { depth: 0 });
            }

            const output = evaled.length > 2000 ? evaled.match(/.{1,2000}/g) : [evaled];
            const pages = output.map((text, index) => {
                return new EmbedBuilder()
                    .setDescription(`\`\`\`js\n${text}\`\`\``)
                    .setFooter({ text: `Page ${index + 1} of ${output.length}` })
                    .setColor(0x00FF00); // You can customize the color
            });

            await paginate(interaction, pages);

        } catch (err) {
            const errorEmbed = new EmbedBuilder()
                .setDescription(`\`\`\`js\n${err}\`\`\``)
                .setColor(0xFF0000); // Red color for errors

            return interaction.reply({ embeds: [errorEmbed] });
        }
    },
};
