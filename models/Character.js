const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    character: { type: String, required: true },
    outfit: { type: String },
    hairstyle: { type: String },
    // Add more fields as needed
});

module.exports = mongoose.model('Character', characterSchema);
