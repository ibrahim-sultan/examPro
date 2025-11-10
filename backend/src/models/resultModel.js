
const mongoose = require('mongoose');

const answerSchema = mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: Number, // Index of the selected option
    },
    isCorrect: {
      type: Boolean,
    },
  },
  { _id: false }
);

const resultSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [answerSchema],
    status: {
      type: String,
      required: true,
      enum: ['In Progress', 'Completed'],
      default: 'In Progress',
    },
    startTime: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
