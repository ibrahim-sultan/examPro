const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: Number,
    },
    optionOrder: {
      type: [Number],
      default: [],
    },
    isCorrect: {
      type: Boolean,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['In Progress', 'Completed', 'Suspended'],
      default: 'In Progress',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    tabSwitchCount: { type: Number, default: 0 },
    blurCount: { type: Number, default: 0 },
    focusCount: { type: Number, default: 0 },
    copyPasteAttempts: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    forcedSubmit: { type: Boolean, default: false },
    multiLoginDetected: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Result', resultSchema);
