import mongoose from 'mongoose';

// Define the schema for a single answer
const answerSchema = mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Response Data: This is where the core answer is stored
    answerValue: { type: mongoose.Schema.Types.Mixed, required: true }
    // Mixed type allows storing text (string), single choice (string), or multiple choices (array of strings)
});

// Define the main response schema
const responseSchema = mongoose.Schema(
    {
        survey: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Survey' },
        answers: [answerSchema],
        // IMPORTANT: We explicitly do NOT store IP, user ID, or any PII to ensure anonymity.
        // We only store the submission timestamp.
        submissionDate: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

const Response = mongoose.model('Response', responseSchema);
export default Response;
