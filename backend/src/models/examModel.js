
const mongoose = require('mongoose');

const examSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    subject: {
      type: String,
      required: true,
    },
    duration: {
      // Duration in minutes
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    markingScheme: {
      correct: {
        type: Number,
        default: 1,
      },
      incorrect: {
        type: Number,
        default: 0, // Can be negative, e.g., -0.25
      },
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    assignedGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
