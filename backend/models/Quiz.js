import mongoose from 'mongoose';

// Schema for a single quiz question
const quizQuestionSchema = mongoose.Schema({
    questionText: { type: String, required: true },
    questionImage: { 
        url: { type: String },
        publicId: { type: String }
    },
    questionType: { 
        type: String, 
        enum: ['SINGLE', 'MULTIPLE', 'TRUE_FALSE'], 
        default: 'SINGLE',
        required: true 
    },
    options: [{
        optionText: { type: String, required: true },
        optionImage: {
            url: { type: String },
            publicId: { type: String }
        },
        isCorrect: { type: Boolean, default: false }
    }],
    points: { type: Number, default: 1 },
    explanation: { type: String } // Optional explanation shown after answering
});

// Main quiz schema
const quizSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        creator: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        classes: [{ type: String }], // Array of class/section names (e.g., ['CSE 5A', 'CSE 5B', 'CSE 5C'])
        questions: [quizQuestionSchema],
        settings: {
            timeLimit: { type: Number, default: 0 }, // Time limit in minutes (0 = no limit)
            shuffleQuestions: { type: Boolean, default: false },
            shuffleOptions: { type: Boolean, default: false },
            showCorrectAnswers: { type: Boolean, default: true }, // Show correct answers after submission
            showExplanations: { type: Boolean, default: true },
            passingScore: { type: Number, default: 60 }, // Percentage needed to pass
            allowRetake: { type: Boolean, default: true },
            maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
            tabSwitchingEnabled: { type: Boolean, default: false }, // Enable tab switch detection (3 switches = auto-submit)
            preventDuplicateRollNo: { type: Boolean, default: false }, // Prevent same roll number from submitting twice
            requireSequentialAnswering: { type: Boolean, default: false }, // Must answer current question before moving to next
            fullscreenModeEnabled: { type: Boolean, default: false } // Force fullscreen mode (3 exits = auto-submit)
        },
        isPublished: { type: Boolean, default: false },
        attemptCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
    return this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

// Ensure virtuals are included in JSON output
quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
