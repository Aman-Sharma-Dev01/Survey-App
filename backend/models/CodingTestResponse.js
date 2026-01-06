import mongoose from 'mongoose';

const codingResultSchema = mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: { type: String, default: '' },
  passedCount: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  results: [
    {
      input: { type: String },
      expected: { type: String },
      output: { type: String },
      pass: { type: Boolean, default: false },
      error: { type: String },
    },
  ],
});

const codingTestResponseSchema = mongoose.Schema(
  {
    codingTest: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'CodingTest' },
    participantName: { type: String, default: 'Anonymous' },
    participantEmail: { type: String },
    participantClass: { type: String },
    participantRollNo: { type: String },
    submissions: [codingResultSchema],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeTaken: { type: Number },
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
    autoSubmittedDueToTabSwitch: { type: Boolean, default: false },
    autoSubmittedDueToFullscreenExit: { type: Boolean, default: false },
    autoSubmittedDueToSplitScreen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CodingTestResponse = mongoose.model('CodingTestResponse', codingTestResponseSchema);
export default CodingTestResponse;
