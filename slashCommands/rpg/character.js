const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const path = require('path');
const Character = require('../../models/Character');

module.exports = {
    name: 'startcreation',
    description: 'Start the character creation process',
    type: 1, // Slash command type
    run: async (client, interaction) => {
        const userId = interaction.user.id;
        let userCharacter = await Character.findOne({ userId });

        // Ensure default character and outfit are set to Character 1 and Outfit 1
        if (!userCharacter) {
            userCharacter = new Character({ userId, character: 'character1', outfit: 'outfit1' });
            await userCharacter.save();
        } else {
            userCharacter.character = 'character1';
            userCharacter.outfit = 'outfit1';
            await userCharacter.save();
        }

        const characterImagePath = path.join(__dirname, '../../assets/characters', userCharacter.character, `${userCharacter.outfit}.png`);
        const image = new AttachmentBuilder(characterImagePath).setName(`${userCharacter.character}_${userCharacter.outfit}.png`);

        const embed = new EmbedBuilder()
            .setTitle('Character Creation')
            .setDescription('Choose your character and outfit, then click **Confirm** when you’re satisfied.')
            .setColor(0x00AE86)
            .addFields(
                { name: 'Character', value: getFormalName(userCharacter.character), inline: true },
                { name: 'Outfit', value: getFormalName(userCharacter.outfit), inline: true }
            )
            .setImage(`attachment://${userCharacter.character}_${userCharacter.outfit}.png`)
            .setFooter({ text: 'Make your choices carefully!' });

        const characterOptions = generateCharacterOptions();
        const outfitOptions = generateOutfitOptions(userCharacter.character);

        await interaction.reply({
            embeds: [embed],
            files: [image],
            components: [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_character')
                        .setPlaceholder('Choose your character')
                        .addOptions(characterOptions)
                ),
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_outfit')
                        .setPlaceholder('Choose your outfit')
                        .addOptions(outfitOptions)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_selection')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Primary)
                )
            ],
        });
    },
};

// Helper functions to generate options and get formal names
function generateCharacterOptions() {
    return [
        { label: 'Character 1', value: 'character1', default: true }, // Mark Character 1 as default
        { label: 'Character 2', value: 'character2' },
    ];
}

function generateOutfitOptions(character) {
    switch (character) {
        case 'character1':
            return [
                { label: 'Outfit 1', value: 'outfit1', default: true }, // Mark Outfit 1 as default
                { label: 'Outfit 2', value: 'outfit2' },
                { label: 'Outfit 3', value: 'outfit3' },
            ];
        case 'character2':
            return [
                { label: 'Outfit 1', value: 'outfit1', default: true }, // Mark Outfit 1 as default
                { label: 'Outfit 2', value: 'outfit2' },
                { label: 'Outfit 3', value: 'outfit3' },
            ];
        default:
            return [];
    }
}

function getFormalName(value) {
    const formalNames = {
        'character1': 'Male',
        'character2': 'Female',
        'outfit1': 'Outfit 1',
        'outfit2': 'Outfit 2',
        'outfit3': 'Outfit 3'
    };
    return formalNames[value] || value;
}
