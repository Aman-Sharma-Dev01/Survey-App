import mongoose from 'mongoose';

const testCaseSchema = mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: { type: String },
});

const codingQuestionSchema = mongoose.Schema({
  title: { type: String, required: true },
  prompt: { type: String, required: true },
  starterCode: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  points: { type: Number, default: 1 },
  timeLimitMs: { type: Number, default: 2000 },
  testCases: [testCaseSchema],
});

const codingTestSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    classes: [{ type: String }],
    questions: [codingQuestionSchema],
    settings: {
      timeLimit: { type: Number, default: 0 }, // minutes; 0 => no limit
      passingScore: { type: Number, default: 60 },
      allowRetake: { type: Boolean, default: true },
      maxAttempts: { type: Number, default: 0 },
      tabSwitchingEnabled: { type: Boolean, default: true },
      preventDuplicateRollNo: { type: Boolean, default: false },
      fullscreenModeEnabled: { type: Boolean, default: true },
      showExpectedOutputs: { type: Boolean, default: true },
    },
    isScheduled: { type: Boolean, default: false },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    timeZone: { type: String, default: 'UTC' },
    isPublished: { type: Boolean, default: false },
    attemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

codingTestSchema.virtual('totalPoints').get(function () {
  return this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

codingTestSchema.virtual('isActive').get(function () {
  if (!this.isPublished) return false;
  if (!this.isScheduled) return true;
  const now = new Date();
  if (this.startAt && now < this.startAt) return false;
  if (this.endAt && now > this.endAt) return false;
  return true;
});

codingTestSchema.set('toJSON', { virtuals: true });
codingTestSchema.set('toObject', { virtuals: true });

const CodingTest = mongoose.model('CodingTest', codingTestSchema);
export default CodingTest;
