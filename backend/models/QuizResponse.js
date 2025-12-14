import mongoose from 'mongoose';

// Schema for a single answer in the quiz response
const quizAnswerSchema = mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptions: [{ type: String }], // Array of selected option texts
    isCorrect: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 }
});

// Main quiz response schema
const quizResponseSchema = mongoose.Schema(
    {
        quiz: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz' },
        participantName: { type: String, default: 'Anonymous' },
        participantEmail: { type: String },
        participantClass: { type: String }, // Selected class/section
        participantRollNo: { type: String }, // Student roll number
        answers: [quizAnswerSchema],
        score: { type: Number, default: 0 }, // Total points earned
        totalPoints: { type: Number, default: 0 }, // Maximum possible points
        percentage: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
        timeTaken: { type: Number }, // Time taken in seconds
        startedAt: { type: Date },
        submittedAt: { type: Date, default: Date.now },
        autoSubmittedDueToTabSwitch: { type: Boolean, default: false }, // True if quiz was auto-submitted due to tab switching
        autoSubmittedDueToFullscreenExit: { type: Boolean, default: false }, // True if quiz was auto-submitted due to fullscreen exit
        autoSubmittedDueToSplitScreen: { type: Boolean, default: false } // True if quiz was auto-submitted due to split screen detection
    },
    { timestamps: true }
);

const QuizResponse = mongoose.model('QuizResponse', quizResponseSchema);
export default QuizResponse;
