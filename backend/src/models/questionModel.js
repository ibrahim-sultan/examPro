
const mongoose = require('mongoose');

const ALLOWED_CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const ALLOWED_DEPARTMENTS = ['General', 'Science', 'Art', 'Commercial'];

const questionSchema = mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionLabel: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['objective', 'theory'],
      required: true,
      lowercase: true,
      trim: true,
    },
    classLevel: {
      type: String,
      enum: ALLOWED_CLASS_LEVELS,
      required: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      enum: ALLOWED_DEPARTMENTS,
      required: true,
      trim: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    correctAnswer: {
      type: String,
      trim: true,
    },
    instruction: {
      type: String,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
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

questionSchema.virtual('question').get(function () {
  return this.questionText;
});

questionSchema.set('toJSON', {
  virtuals: true,
});
questionSchema.set('toObject', {
  virtuals: true,
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
