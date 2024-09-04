const { AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Character = require('../models/Character');
const path = require('path');

async function selectMenuHandler(interaction) {
    const selectedValue = interaction.values ? interaction.values[0] : null;
    const userId = interaction.user.id;

    let userCharacter = await Character.findOne({ userId });

    if (!userCharacter) {
        userCharacter = new Character({ userId });
    }

    if (interaction.user.id !== userCharacter.userId) {
        await interaction.reply({ content: "You can't interact with this menu.", ephemeral: true });
        return;
    }

    let embedDescription = '';
    let imageFilePath = '';

    // Handle character selection
    if (interaction.customId === 'select_character') {
        userCharacter.character = selectedValue;
        userCharacter.outfit = 'outfit1'; // Default outfit for selected character
        await userCharacter.save();

        imageFilePath = path.join(__dirname, '../assets/characters', userCharacter.character, 'outfit1.png');
        embedDescription = `You selected ${getFormalName(userCharacter.character)}. Choose an outfit or confirm your selection.`;
    }
    // Handle outfit selection
    else if (interaction.customId === 'select_outfit') {
        userCharacter.outfit = selectedValue;
        await userCharacter.save();

        imageFilePath = path.join(__dirname, '../assets/characters', userCharacter.character, `${userCharacter.outfit}.png`);
        embedDescription = `You selected ${getFormalName(userCharacter.outfit)}. Confirm your selection or choose another character or outfit.`;
    }

    const image = new AttachmentBuilder(imageFilePath);

    const embed = new EmbedBuilder()
        .setTitle('Character Creation')
        .setDescription(embedDescription)
        .setColor(0x00AE86)
        .addFields(
            { name: 'Character', value: getFormalName(userCharacter.character), inline: true },
            { name: 'Outfit', value: getFormalName(userCharacter.outfit), inline: true }
        )
        .setImage(`attachment://${path.basename(imageFilePath)}`)
        .setFooter({ text: 'Make your choices carefully!' });

    const characterOptions = generateCharacterOptions();
    const outfitOptions = generateOutfitOptions(userCharacter.character);

    await interaction.update({
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
}

module.exports = { selectMenuHandler };

// Helper function to generate character options
function generateCharacterOptions() {
    return [
        { label: 'Character 1', value: 'character1' },
        { label: 'Character 2', value: 'character2' },
    ];
}

// Helper function to generate outfit options based on the selected character
function generateOutfitOptions(character) {
    switch (character) {
        case 'character1':
            return [
                { label: 'Outfit 1', value: 'outfit1' },
                { label: 'Outfit 2', value: 'outfit2' },
                { label: 'Outfit 3', value: 'outfit3' },
            ];
        case 'character2':
            return [
                { label: 'Outfit 1', value: 'outfit1' },
                { label: 'Outfit 2', value: 'outfit2' },
                { label: 'Outfit 3', value: 'outfit3' },
            ];
        default:
            return [];
    }
}

// Helper function to get formal names
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
