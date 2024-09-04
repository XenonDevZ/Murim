const { EmbedBuilder, Collection, PermissionsBitField } = require('discord.js');
const ms = require('ms');
const client = require('..');
const config = require('../config.json');

// Import the selectMenuHandler
const { selectMenuHandler } = require('./selectMenuHandler');

const cooldown = new Collection();

client.on('interactionCreate', async interaction => {
    // Handle select menu interactions
    if (interaction.isSelectMenu()) {
        await selectMenuHandler(interaction);
        return; // Exit after handling the select menu
    }

    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
        const slashCommand = client.slashCommands.get(interaction.commandName);
        if (slashCommand && slashCommand.autocomplete) {
            const choices = [];
            await slashCommand.autocomplete(interaction, choices);
        }
        return; // Exit after handling the autocomplete
    }

    // Handle command interactions
    if (interaction.isCommand()) {
        const slashCommand = client.slashCommands.get(interaction.commandName);
        if (!slashCommand) return client.slashCommands.delete(interaction.commandName);

        try {
            if (slashCommand.cooldown) {
                const cooldownKey = `slash-${slashCommand.name}${interaction.user.id}`;
                if (cooldown.has(cooldownKey)) {
                    const remainingTime = ms(cooldown.get(cooldownKey) - Date.now(), { long: true });
                    return interaction.reply({ content: config.messages["COOLDOWN_MESSAGE"].replace('<duration>', remainingTime), ephemeral: true });
                }
                cooldown.set(cooldownKey, Date.now() + slashCommand.cooldown);
                setTimeout(() => cooldown.delete(cooldownKey), slashCommand.cooldown);
            }

            if (slashCommand.userPerms || slashCommand.botPerms) {
                if (!interaction.memberPermissions.has(PermissionsBitField.resolve(slashCommand.userPerms || []))) {
                    const userPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${interaction.user}, You don't have \`${slashCommand.userPerms}\` permissions to use this command!`)
                        .setColor('Red');
                    return interaction.reply({ embeds: [userPerms], ephemeral: true });
                }
                if (!interaction.guild.members.cache.get(client.user.id).permissions.has(PermissionsBitField.resolve(slashCommand.botPerms || []))) {
                    const botPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${interaction.user}, I don't have \`${slashCommand.botPerms}\` permissions to use this command!`)
                        .setColor('Red');
                    return interaction.reply({ embeds: [botPerms], ephemeral: true });
                }
            }

            await slashCommand.run(client, interaction);

        } catch (error) {
            console.error(error);
        }
    }
});
