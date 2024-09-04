const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandType } = require('discord.js');
const gis = require('async-g-i-s');
const config = require('../../config.json'); // Adjust the path if necessary

module.exports = {
    name: 'imagesearch',
    description: 'Search for images on Google with pagination.',
    category: "Fun",
    type: ApplicationCommandType.ChatInput, // Indicating this is a slash command
    options: [
        {
            name: 'query',
            type: 3, // 3 indicates a STRING type
            description: 'The search query for finding images.',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const query = interaction.options.getString('query');

        try {
            const results = await gis(query);

            if (!results || results.length === 0) {
                return interaction.reply(`No images found for \`${query}\`.`);
            }

            let pageIndex = 0;

            const generateEmbed = (index) => {
                const image = results[index];
                return new EmbedBuilder()
                    .setTitle(`Results for "${query}"`)
                    .setImage(image.url)
                    .setFooter({
                        text: `Page ${index + 1} of ${results.length}`,
                    })
                    .setColor(config.embedColor);
            };

            const components = (state) => [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('Back')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(state),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(state)
                ),
            ];

            const embedMessage = await interaction.reply({
                embeds: [generateEmbed(pageIndex)],
                components: components(results.length <= 1),
                fetchReply: true,
            });

            const filter = (i) => i.user.id === interaction.user.id;

            const collector = embedMessage.createMessageComponentCollector({
                filter,
                time: 60000, // 60 seconds
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'back') {
                    pageIndex--;
                    if (pageIndex < 0) pageIndex = results.length - 1;
                } else if (i.customId === 'next') {
                    pageIndex++;
                    if (pageIndex >= results.length) pageIndex = 0;
                }

                await i.update({
                    embeds: [generateEmbed(pageIndex)],
                    components: components(results.length <= 1),
                });
            });

            collector.on('end', () => {
                interaction.editReply({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('back')
                                .setLabel('Back')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        ),
                    ],
                });
            });
        } catch (error) {
            console.error('Error executing image search:', error);
            interaction.reply('An error occurred while searching for images. Please try again later.');
        }
    },
};
