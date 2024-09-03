const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'reload',
    aliases: ['refresh'],
    description: 'Reloads all message command files without restarting the bot',
    run: async (client, message) => {
        const ownerID = client.config.ownerId;
        if (message.author.id !== ownerID) {return('');
        }

        await reloadCommands(client, message);
    },
};

async function reloadCommands(client, message) {
    const successfulReloads = [];
    const failedReloads = [];

    try {
        const commandsPath = path.join(__dirname, '..');
        const commandFolders = fs.readdirSync(commandsPath);

        // Reload all message commands
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    try {
                        delete require.cache[require.resolve(filePath)];
                        const newCommand = require(filePath);

                        // Add to commands collection
                        client.commands.set(newCommand.name, newCommand);
                        successfulReloads.push(`\`${newCommand.name}\``);
                    } catch (error) {
                        const errorMessage = `\`${file}\`: ${error.message}`;
                        failedReloads.push(errorMessage);
                    }
                }
            }
        }

        // Create the reload report embed with highlighted command names
        const reloadEmbed = new EmbedBuilder()
            .setTitle('🔄 Command Reload Report')
            .setColor(0x00FF00)
            .setDescription('The following report summarizes the results of the command reload operation:')
            .addFields(
                { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
            )
            .addFields(
                { name: '✅ Successfully Reloaded Commands', value: successfulReloads.length > 0 ? successfulReloads.join(', ') : 'No commands reloaded successfully.', inline: false }
            )
            .addFields(
                { name: '❌ Failed to Reload Commands', value: failedReloads.length > 0 ? failedReloads.join('\n') : 'No commands failed to reload.', inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [reloadEmbed] });
    } catch (error) {
        console.error('Error during reloading commands:', error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('⚠️ Reload Error')
            .setDescription(`An error occurred while reloading commands: \`${error.message}\``)
            .setColor('FF0000')
            .setTimestamp();
        message.channel.send({ embeds: [errorEmbed] });
    }
}
