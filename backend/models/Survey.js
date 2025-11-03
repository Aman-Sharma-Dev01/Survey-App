
import mongoose from 'mongoose';

// Define the schema for a single question
const questionSchema = mongoose.Schema({
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['TEXT', 'RADIO', 'CHECKBOX', 'LIKERT', 'SLIDER'], required: true },
    options: [{
        optionText: { type: String },
        value: { type: String } // Stored value for analysis
    }],
    isRequired: { type: Boolean, default: false }
    // You can add fields for skip logic here if implementing later
});

// Define the main survey schema
const surveySchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        creator: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        questions: [questionSchema],
        isPublished: { type: Boolean, default: false },
        responseCount: { type: Number, default: 0 } // Cached count for dashboard
    },
    { timestamps: true }
);

const Survey = mongoose.model('Survey', surveySchema);
export default Survey;
