'use strict';

const mongoose = require('mongoose');

const projectMessageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    attachments: [
      {
        file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
        filename: String,
        mimetype: String,
        size: Number,
        url: String,
      },
    ],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

projectMessageSchema.index({ project: 1, createdAt: -1 });
projectMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('ProjectMessage', projectMessageSchema);
