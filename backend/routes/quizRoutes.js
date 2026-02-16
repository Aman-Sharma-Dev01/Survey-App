import express from 'express';
import Quiz from '../models/Quiz.js';
import QuizResponse from '../models/QuizResponse.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Collaboration Helpers ---
const isCreatorOrCollaborator = (quiz, userId) => {
    if (quiz.creator.toString() === userId.toString()) return 'creator';
    const collab = quiz.collaborators?.find(c => {
        const collabId = c.user?._id || c.user;
        return collabId?.toString() === userId.toString();
    });
    return collab ? collab.role : null;
};

const canEdit = (quiz, userId) => {
    const role = isCreatorOrCollaborator(quiz, userId);
    return role === 'creator' || role === 'editor';
};

/* ===========================================================
   CREATE NEW QUIZ
   POST /api/quizzes (Private)
=========================================================== */
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, questions, settings, classes, rollNumbers, isScheduled, startAt, endAt, timeZone } = req.body;

        const quiz = new Quiz({
            title,
            description,
            questions,
            settings,
            classes: classes || [],
            rollNumbers: rollNumbers || [],
            creator: req.user._id,
            isScheduled: !!isScheduled,
            startAt: startAt ? new Date(startAt) : null,
            endAt: endAt ? new Date(endAt) : null,
            timeZone: timeZone || 'UTC'
        });

        const createdQuiz = await quiz.save();
        res.status(201).json(createdQuiz);
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
});

/* ===========================================================
   GET ALL QUIZZES FOR CREATOR
   GET /api/quizzes (Private)
=========================================================== */
router.get('/', protect, async (req, res) => {
    try {
        // Fetch owned quizzes + quizzes shared with this user
        const quizzes = await Quiz.find({
            $or: [
                { creator: req.user._id },
                { 'collaborators.user': req.user._id }
            ]
        }).populate('creator', 'name email').populate('collaborators.user', 'name email avatar').sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        console.error('Error in GET /api/quizzes:', error);
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
});

/* ===========================================================
   GET PUBLIC QUIZ (for taking) - MUST BE BEFORE /:id
   GET /api/quizzes/public/:id (Public)
=========================================================== */
router.get('/public/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!quiz.isPublished) {
            return res.status(403).json({ message: 'This quiz is not available' });
        }

        // Enforce scheduling if enabled
        if (quiz.isScheduled) {
            const now = new Date();
            if (quiz.startAt && now < quiz.startAt) {
                return res.status(403).json({
                    message: 'This quiz is scheduled for a future time',
                    isScheduled: true,
                    startAt: quiz.startAt,
                    endAt: quiz.endAt || null,
                    timeZone: quiz.timeZone || 'UTC'
                });
            }
            if (quiz.endAt && now > quiz.endAt) {
                return res.status(403).json({
                    message: 'This quiz has ended',
                    isScheduled: true,
                    startAt: quiz.startAt || null,
                    endAt: quiz.endAt,
                    timeZone: quiz.timeZone || 'UTC'
                });
            }
        }

        // Return quiz without correct answers
        const publicQuiz = {
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            classes: quiz.classes || [],
            rollNumbers: quiz.rollNumbers || [],
            isScheduled: !!quiz.isScheduled,
            startAt: quiz.startAt || null,
            endAt: quiz.endAt || null,
            timeZone: quiz.timeZone || 'UTC',
            questions: quiz.questions.map(q => ({
                _id: q._id,
                questionText: q.questionText,
                questionImage: q.questionImage, // Include question image
                questionType: q.questionType,
                options: q.options.map(opt => ({
                    optionText: opt.optionText,
                    optionImage: opt.optionImage // Include option image
                    // isCorrect is intentionally NOT included
                })),
                points: q.points
            })),
            settings: {
                timeLimit: quiz.settings.timeLimit,
                shuffleQuestions: quiz.settings.shuffleQuestions,
                shuffleOptions: quiz.settings.shuffleOptions,
                tabSwitchingEnabled: quiz.settings.tabSwitchingEnabled,
                preventDuplicateRollNo: quiz.settings.preventDuplicateRollNo,
                requireSequentialAnswering: quiz.settings.requireSequentialAnswering,
                fullscreenModeEnabled: quiz.settings.fullscreenModeEnabled
            },
            totalPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0)
        };

        res.json(publicQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz' });
    }
});

/* ===========================================================
   CHECK IF ROLL NUMBER EXISTS FOR QUIZ
   POST /api/quizzes/check-rollno/:id (Public)
=========================================================== */
router.post('/check-rollno/:id', async (req, res) => {
    try {
        const { rollNo } = req.body;

        if (!rollNo || !rollNo.trim()) {
            return res.json({ exists: false });
        }

        // Get quiz to check if preventDuplicateRollNo is enabled
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz || !quiz.settings?.preventDuplicateRollNo) {
            return res.json({ exists: false });
        }

        const existingResponse = await QuizResponse.findOne({
            quiz: req.params.id,
            participantRollNo: rollNo.trim()
        });

        if (existingResponse) {
            return res.json({
                exists: true,
                message: `Response already recorded for roll no "${rollNo}"`
            });
        }

        res.json({ exists: false });
    } catch (error) {
        res.status(500).json({ message: 'Error checking roll number' });
    }
});

/* ===========================================================
   SUBMIT QUIZ RESPONSE - MUST BE BEFORE /:id
   POST /api/quizzes/submit/:id (Public)
=========================================================== */
router.post('/submit/:id', async (req, res) => {
    try {
        const { answers, participantName, participantEmail, participantClass, participantRollNo, timeTaken, startedAt, autoSubmittedDueToTabSwitch, autoSubmittedDueToFullscreenExit, autoSubmittedDueToSplitScreen } = req.body;

        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!quiz.isPublished) {
            return res.status(403).json({ message: 'This quiz is not available' });
        }

        // Enforce scheduling if enabled
        if (quiz.isScheduled) {
            const now = new Date();
            if (quiz.startAt && now < quiz.startAt) {
                return res.status(403).json({
                    message: 'This quiz is scheduled for a future time',
                    isScheduled: true,
                    startAt: quiz.startAt,
                    endAt: quiz.endAt || null,
                    timeZone: quiz.timeZone || 'UTC'
                });
            }
            if (quiz.endAt && now > quiz.endAt) {
                return res.status(403).json({
                    message: 'This quiz has ended',
                    isScheduled: true,
                    startAt: quiz.startAt || null,
                    endAt: quiz.endAt,
                    timeZone: quiz.timeZone || 'UTC'
                });
            }
        }

        // Check if roll number already exists for this quiz (only if setting is enabled)
        if (quiz.settings?.preventDuplicateRollNo && participantRollNo && participantRollNo.trim()) {
            const existingResponse = await QuizResponse.findOne({
                quiz: req.params.id,
                participantRollNo: participantRollNo.trim()
            });

            if (existingResponse) {
                return res.status(400).json({
                    message: `Response already recorded for roll no "${participantRollNo}"`,
                    rollNoExists: true
                });
            }
        }

        // Grade the quiz
        let totalScore = 0;
        const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);

        const gradedAnswers = answers.map(answer => {
            const question = quiz.questions.find(q => q._id.toString() === answer.questionId);

            if (!question) {
                return { ...answer, isCorrect: false, pointsEarned: 0 };
            }

            // Non-gradable types: just record the answer
            if (['RATING', 'SHORT_TEXT', 'LONG_TEXT', 'DATE'].includes(question.questionType)) {
                return {
                    questionId: answer.questionId,
                    selectedOptions: answer.selectedOptions,
                    isCorrect: false,
                    pointsEarned: 0
                };
            }

            // Find correct options
            const correctOptions = question.options
                .filter(opt => opt.isCorrect)
                .map(opt => opt.optionText);

            // Check if answer is correct
            let isCorrect = false;

            if (question.questionType === 'MULTIPLE') {
                // For multiple choice, all correct options must be selected and no incorrect ones
                const selected = answer.selectedOptions || [];
                isCorrect = correctOptions.length === selected.length &&
                    correctOptions.every(opt => selected.includes(opt));
            } else {
                // For single choice / true-false, selected must match correct
                const selected = answer.selectedOptions?.[0];
                isCorrect = correctOptions.includes(selected);
            }

            const pointsEarned = isCorrect ? (question.points || 1) : 0;
            totalScore += pointsEarned;

            return {
                questionId: answer.questionId,
                selectedOptions: answer.selectedOptions,
                isCorrect,
                pointsEarned
            };
        });

        const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
        const passed = percentage >= (quiz.settings.passingScore || 60);

        // Create response
        const quizResponse = new QuizResponse({
            quiz: quiz._id,
            participantName: participantName || 'Anonymous',
            participantEmail,
            participantClass: participantClass || '',
            participantRollNo: participantRollNo || '',
            answers: gradedAnswers,
            score: totalScore,
            totalPoints,
            percentage,
            passed,
            timeTaken,
            startedAt: startedAt ? new Date(startedAt) : new Date(),
            autoSubmittedDueToTabSwitch: autoSubmittedDueToTabSwitch || false,
            autoSubmittedDueToFullscreenExit: autoSubmittedDueToFullscreenExit || false,
            autoSubmittedDueToSplitScreen: autoSubmittedDueToSplitScreen || false
        });

        await quizResponse.save();

        // Update attempt count
        quiz.attemptCount += 1;
        await quiz.save();

        // Prepare response with correct answers if settings allow
        const responseData = {
            _id: quizResponse._id,
            score: totalScore,
            totalPoints,
            percentage,
            passed,
            timeTaken
        };

        if (quiz.settings.showCorrectAnswers) {
            responseData.gradedAnswers = gradedAnswers;
            responseData.correctAnswers = quiz.questions.map(q => ({
                questionId: q._id,
                questionText: q.questionText,
                correctOptions: q.options.filter(opt => opt.isCorrect).map(opt => opt.optionText),
                explanation: quiz.settings.showExplanations ? q.explanation : undefined
            }));
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ message: 'Error submitting quiz' });
    }
});

/* ===========================================================
   GET QUIZ ANALYTICS - MUST BE BEFORE /:id
   GET /api/quizzes/analytics/:id (Private)
=========================================================== */
router.get('/analytics/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!isCreatorOrCollaborator(quiz, req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const responses = await QuizResponse.find({ quiz: req.params.id })
            .sort({ submittedAt: -1 });

        // Calculate analytics
        const totalResponses = responses.length;
        const passedCount = responses.filter(r => r.passed).length;
        const avgScore = totalResponses > 0
            ? Math.round(responses.reduce((sum, r) => sum + r.percentage, 0) / totalResponses)
            : 0;
        const avgTime = totalResponses > 0
            ? Math.round(responses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / totalResponses)
            : 0;

        // Question-level analytics
        const questionStats = quiz.questions.map(question => {
            const questionResponses = responses.flatMap(r =>
                r.answers.filter(a => a.questionId.toString() === question._id.toString())
            );
            const correctCount = questionResponses.filter(a => a.isCorrect).length;

            const stats = {
                questionId: question._id,
                questionText: question.questionText,
                questionType: question.questionType,
                totalAttempts: questionResponses.length,
                correctCount,
                accuracy: questionResponses.length > 0
                    ? Math.round((correctCount / questionResponses.length) * 100)
                    : 0
            };

            if (question.questionType === 'RATING') {
                const totalRating = questionResponses.reduce((sum, r) => sum + (parseInt(r.selectedOptions?.[0]) || 0), 0);
                stats.averageRating = questionResponses.length > 0
                    ? parseFloat((totalRating / questionResponses.length).toFixed(1))
                    : 0;
            }

            return stats;
        });

        // Get unique classes from responses
        const classesFromResponses = [...new Set(responses.map(r => r.participantClass).filter(Boolean))];

        // Class-wise analytics
        const classStats = classesFromResponses.map(className => {
            const classResponses = responses.filter(r => r.participantClass === className);
            const classPassed = classResponses.filter(r => r.passed).length;
            const classAvgScore = classResponses.length > 0
                ? Math.round(classResponses.reduce((sum, r) => sum + r.percentage, 0) / classResponses.length)
                : 0;
            return {
                className,
                totalResponses: classResponses.length,
                passedCount: classPassed,
                avgScore: classAvgScore
            };
        });

        res.json({
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                classes: quiz.classes || [],
                totalPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0)
            },
            analytics: {
                totalResponses,
                passedCount,
                failedCount: totalResponses - passedCount,
                passRate: totalResponses > 0 ? Math.round((passedCount / totalResponses) * 100) : 0,
                avgScore,
                avgTime
            },
            classStats,
            questionStats,
            recentResponses: responses.map(r => ({
                _id: r._id,
                participantName: r.participantName,
                participantClass: r.participantClass || '',
                participantRollNo: r.participantRollNo || '',
                score: r.score,
                totalPoints: r.totalPoints,
                percentage: r.percentage,
                passed: r.passed,
                timeTaken: r.timeTaken,
                submittedAt: r.submittedAt,
                autoSubmittedDueToTabSwitch: r.autoSubmittedDueToTabSwitch || false,
                autoSubmittedDueToFullscreenExit: r.autoSubmittedDueToFullscreenExit || false,
                autoSubmittedDueToSplitScreen: r.autoSubmittedDueToSplitScreen || false
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

/* ===========================================================
   GET QUIZ BY ID (for editing) - AFTER specific routes
   GET /api/quizzes/:id (Private)
=========================================================== */
router.get('/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('collaborators.user', 'name email avatar');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!isCreatorOrCollaborator(quiz, req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz' });
    }
});

/* ===========================================================
   UPDATE QUIZ
   PUT /api/quizzes/:id (Private)
=========================================================== */
router.put('/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!canEdit(quiz, req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to edit this quiz' });
        }

        const { title, description, questions, settings, isPublished, classes, rollNumbers, isScheduled, startAt, endAt, timeZone } = req.body;

        if (title) quiz.title = title;
        if (description !== undefined) quiz.description = description;
        if (questions) quiz.questions = questions;
        if (settings) quiz.settings = { ...quiz.settings, ...settings };
        if (isPublished !== undefined) quiz.isPublished = isPublished;
        if (classes !== undefined) quiz.classes = classes;
        if (rollNumbers !== undefined) quiz.rollNumbers = rollNumbers;
        if (typeof isScheduled === 'boolean') quiz.isScheduled = isScheduled;
        if (startAt !== undefined) quiz.startAt = startAt ? new Date(startAt) : null;
        if (endAt !== undefined) quiz.endAt = endAt ? new Date(endAt) : null;
        if (timeZone !== undefined) quiz.timeZone = timeZone;

        const updatedQuiz = await quiz.save();
        res.json(updatedQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz' });
    }
});

/* ===========================================================
   DELETE QUIZ
   DELETE /api/quizzes/:id (Private)
=========================================================== */
router.delete('/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (quiz.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete all responses for this quiz
        await QuizResponse.deleteMany({ quiz: req.params.id });

        // Delete the quiz
        await Quiz.deleteOne({ _id: req.params.id });

        res.json({ message: 'Quiz and all responses deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz' });
    }
});

/* ===========================================================
   ADD COLLABORATOR TO QUIZ
   POST /api/quizzes/:id/collaborators (Private - Creator only)
=========================================================== */
router.post('/:id/collaborators', protect, async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Only the creator can add collaborators
        if (quiz.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the quiz creator can add collaborators' });
        }

        // Check if the user exists in SurveyZen
        const collaboratorUser = await User.findOne({ email: email.toLowerCase() }).select('_id name email avatar');
        if (!collaboratorUser) {
            return res.status(404).json({ message: 'No SurveyZen account found with this email. Ask them to sign up first.' });
        }

        // Can't add yourself
        if (collaboratorUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot add yourself as a collaborator' });
        }

        // Check if already a collaborator
        const existing = quiz.collaborators.find(c => c.user.toString() === collaboratorUser._id.toString());
        if (existing) {
            return res.status(400).json({ message: 'This user is already a collaborator' });
        }

        quiz.collaborators.push({
            user: collaboratorUser._id,
            email: collaboratorUser.email,
            role: role || 'editor'
        });

        await quiz.save();

        // Return the new collaborator with populated user info
        res.status(201).json({
            user: { _id: collaboratorUser._id, name: collaboratorUser.name, email: collaboratorUser.email, avatar: collaboratorUser.avatar },
            email: collaboratorUser.email,
            role: role || 'editor',
            addedAt: new Date()
        });
    } catch (error) {
        console.error('Add collaborator error:', error);
        res.status(500).json({ message: 'Error adding collaborator' });
    }
});

/* ===========================================================
   REMOVE COLLABORATOR FROM QUIZ
   DELETE /api/quizzes/:id/collaborators/:userId (Private - Creator only)
=========================================================== */
router.delete('/:id/collaborators/:userId', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Only the creator can remove collaborators
        if (quiz.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the quiz creator can remove collaborators' });
        }

        quiz.collaborators = quiz.collaborators.filter(
            c => c.user.toString() !== req.params.userId
        );

        await quiz.save();
        res.json({ message: 'Collaborator removed' });
    } catch (error) {
        console.error('Remove collaborator error:', error);
        res.status(500).json({ message: 'Error removing collaborator' });
    }
});

export default router;
