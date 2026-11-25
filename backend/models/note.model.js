const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            default: "General",
        },
        isPinned: {
            type: Boolean,
            default: false,
            required: true,
        },
        isFavorite: {
            type: Boolean,
            default: false,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        userId: {
            type: mongoose.Schema.Types.Mixed,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Note', noteSchema, 'notes');
