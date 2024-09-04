const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const paginate = require('../../utils/paginate');

module.exports = {
    name: 'help',
    description: 'Get information on slash commands, categories, or keywords.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'query',
            type: 3, // STRING type
            description: 'Search for a command, category, or keyword',
            required: false,
        },
    ],
    category: 'Utility',
    run: async (client, interaction) => {
        const messagePrefix = client.config?.prefix || '!';
        const query = interaction.options.getString('query')?.toLowerCase() || '';

        // Separate slash commands, excluding commands without categories
        const categories = {
            SlashCommands: {},
        };

        // Categorize slash commands
        client.slashCommands.forEach(command => {
            const category = command.category;
            if (!category) return; // Exclude commands without a category
            if (!categories.SlashCommands[category]) categories.SlashCommands[category] = [];
            categories.SlashCommands[category].push(command);
        });

        const commandsPerPage = 5;
        const pages = [];

        if (!query.length) {
            // First page: Help command overview
            const helpEmbed = new EmbedBuilder()
                .setTitle('Help Command Overview')
                .setDescription(
                    `Use \`/help [command | keyword]\` to get details about slash commands.\n\nHere are some examples of how to use the help command:\n` +
                    `\`/help imagesearch\` - Get details about the \`imagesearch\` command.\n` +
                    `\`/help Utility\` - Get a list of all commands in the Utility category.\n\n` +
                    `Message commands use \`${messagePrefix}\` as a prefix, e.g., \`${messagePrefix}ping\`.\n\n` +
                    `Slash commands are triggered with \`/\`.`
                )
                .setColor(0x2ECC71);

            pages.push(helpEmbed);

            // Process the categories and commands for slash commands
            Object.keys(categories.SlashCommands).forEach(category => {
                const categoryCommands = categories.SlashCommands[category];

                for (let i = 0; i < categoryCommands.length; i += commandsPerPage) {
                    const currentCommands = categoryCommands.slice(i, i + commandsPerPage);

                    const embed = new EmbedBuilder()
                        .setTitle(`Slash Commands - ${category}`)
                        .setColor(0x2ECC71)
                        .setDescription(`Here are the slash commands in the ${category} category:`);

                    currentCommands.forEach(command => {
                        const commandName = command.name || command.data.name;
                        const description = command.description || 'No description provided.';
                        const usage = command.usage
                            ? command.usage.includes(commandName)
                                ? `\`${command.usage}\``
                                : `\`/${commandName} ${command.usage}\``
                            : `\`/${commandName}\``;
                        const aliases = command.aliases ? `\nAliases: ${command.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                        embed.addFields(
                            { name: `\`/${commandName}\``, value: `${description}${aliases}`, inline: false },
                            { name: 'Usage', value: usage, inline: true }
                        );
                    });

                    pages.push(embed);
                }
            });

            // Paginate using your utility function
            await paginate(interaction, pages);
        } else {
            // First, try to find a command by name or alias
            const command =
                client.slashCommands.get(query) ||
                client.slashCommands.find(cmd => cmd.aliases && cmd.aliases.includes(query));

            if (command) {
                const commandName = command.name || command.data.name;
                const description = command.description || 'No description provided.';
                const usage = command.usage
                    ? command.usage.includes(commandName)
                        ? `\`${command.usage}\``
                        : `\`/${commandName} ${command.usage}\``
                    : `\`/${commandName}\``;
                const aliases = command.aliases ? `\nAliases: ${command.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                const embed = new EmbedBuilder()
                    .setTitle(`Command: ${commandName}`)
                    .setDescription(description)
                    .addFields(
                        { name: 'Usage', value: usage, inline: false },
                        { name: 'Category', value: command.category || 'No category', inline: false }
                    )
                    .setColor(0x2ECC71);

                if (aliases) {
                    embed.addFields({ name: 'Aliases', value: aliases });
                }

                return interaction.reply({ embeds: [embed] });
            }

            // If no exact command found, search slash commands by keyword
            const matchedCategory = Object.keys(categories.SlashCommands).find(category => category.toLowerCase() === query);

            if (matchedCategory) {
                const categoryCommands = categories.SlashCommands[matchedCategory];
                const embed = new EmbedBuilder()
                    .setTitle(`Slash Commands - ${matchedCategory}`)
                    .setColor(0x2ECC71)
                    .setDescription(`Here are the slash commands in the ${matchedCategory} category:`);

                categoryCommands.forEach(command => {
                    const commandName = command.name || command.data.name;
                    const description = command.description || 'No description provided.';
                    const usage = command.usage
                        ? command.usage.includes(commandName)
                            ? `\`${command.usage}\``
                            : `\`/${commandName} ${command.usage}\``
                        : `\`/${commandName}\``;
                    const aliases = command.aliases ? `\nAliases: ${command.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                    embed.addFields(
                        { name: `\`/${commandName}\``, value: `${description}${aliases}`, inline: false },
                        { name: 'Usage', value: usage, inline: true }
                    );
                });

                return interaction.reply({ embeds: [embed] });
            }

            // Search slash commands by keyword
            const matchedCommands = client.slashCommands.filter(cmd => cmd.description && cmd.description.toLowerCase().includes(query));

            if (matchedCommands.size > 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`Commands matching "${query}"`)
                    .setColor(0x2ECC71);

                matchedCommands.forEach(cmd => {
                    const commandName = cmd.name || cmd.data.name;
                    const description = cmd.description || 'No description provided.';
                    const usage = cmd.usage
                        ? cmd.usage.includes(commandName)
                            ? `\`${cmd.usage}\``
                            : `\`/${commandName} ${cmd.usage}\``
                        : `\`/${commandName}\``;
                    const aliases = cmd.aliases ? `\nAliases: ${cmd.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                    embed.addFields(
                        { name: `\`/${commandName}\``, value: `${description}${aliases}`, inline: false },
                        { name: 'Usage', value: usage, inline: true }
                    );
                });

                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply({ content: `No slash commands found matching "${query}".`, ephemeral: true });
            }
        }
    },
};
