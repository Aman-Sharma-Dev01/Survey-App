/**
 * Re-grade Quiz Responses Script (with Backup)
 * 
 * Targets: "Machine Learning Quiz-I" by mamta@mru.edu.in
 * 
 * Steps:
 *   1. Backs up ALL existing responses to a "quizresponses_backup" collection
 *   2. Re-grades each response by comparing selectedOptions against correct answers
 *   3. Saves corrected scores
 * 
 * Usage:
 *   node scripts/regrade_quizzes.js --dry-run   (preview only)
 *   node scripts/regrade_quizzes.js              (backup + fix)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Quiz from '../models/Quiz.js';
import QuizResponse from '../models/QuizResponse.js';
import User from '../models/User.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function regradeQuiz() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        if (DRY_RUN) {
            console.log('🔍 DRY RUN MODE — no changes will be saved\n');
        }

        // ─── Step 1: Find the target quiz ───
        const creator = await User.findOne({ email: 'mamta@mru.edu.in' });
        if (!creator) {
            console.log('❌ Creator mamta@mru.edu.in not found');
            return;
        }

        const quiz = await Quiz.findOne({
            title: { $regex: /Machine Learning Quiz/i },
            creator: creator._id
        });

        if (!quiz) {
            console.log('❌ Quiz "Machine Learning Quiz-I" not found for mamta@mru.edu.in');
            // List available quizzes by this creator
            const quizzes = await Quiz.find({ creator: creator._id }).select('title');
            console.log('   Available quizzes by this creator:');
            quizzes.forEach(q => console.log(`     - "${q.title}"`));
            return;
        }

        console.log(`📝 Found quiz: "${quiz.title}" (ID: ${quiz._id})`);
        console.log(`   Questions: ${quiz.questions.length}`);
        console.log(`   Total Points: ${quiz.questions.reduce((s, q) => s + (q.points || 1), 0)}\n`);

        // ─── Step 2: Fetch responses ───
        const responses = await QuizResponse.find({ quiz: quiz._id });
        console.log(`📊 Found ${responses.length} responses\n`);

        if (responses.length === 0) {
            console.log('Nothing to re-grade.');
            return;
        }

        // ─── Step 3: Backup to quizresponses_backup collection ───
        if (!DRY_RUN) {
            console.log('💾 Backing up responses to "quizresponses_backup" collection...');
            const backupCollection = mongoose.connection.collection('quizresponses_backup');

            // Add metadata to each backup doc
            const backupDocs = responses.map(r => ({
                ...r.toObject(),
                _original_id: r._id,
                _backup_date: new Date(),
                _backup_reason: 'regrade_script_fix_id_stripping_bug'
            }));

            // Remove _id so MongoDB assigns new ones (avoids duplicate key)
            backupDocs.forEach(doc => delete doc._id);

            await backupCollection.insertMany(backupDocs);
            console.log(`   ✅ Backed up ${backupDocs.length} responses\n`);
        } else {
            console.log('💾 [DRY RUN] Would backup responses to "quizresponses_backup"\n');
        }

        // ─── Step 4: Re-grade ───
        console.log('🔄 Re-grading responses...\n');

        // Build question lookup map
        const questionMap = new Map();
        for (const q of quiz.questions) {
            questionMap.set(q._id.toString(), q);
        }

        const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        let fixedCount = 0;
        let alreadyCorrectCount = 0;

        for (const response of responses) {
            let newTotalScore = 0;
            let scoreChanged = false;

            const newAnswers = response.answers.map(answer => {
                // Try to find the question by ID
                let question = questionMap.get(answer.questionId.toString());

                // If not found (orphaned due to ID change), match by option texts
                if (!question) {
                    for (const q of quiz.questions) {
                        if (!['SINGLE', 'MULTIPLE', 'TRUE_FALSE'].includes(q.questionType)) continue;
                        const qOptTexts = q.options.map(o => o.optionText);
                        const selected = answer.selectedOptions || [];
                        if (selected.length > 0 && selected.every(s => qOptTexts.includes(s))) {
                            question = q;
                            break;
                        }
                    }
                }

                if (!question) return answer;

                // Skip non-gradable types
                if (['RATING', 'SHORT_TEXT', 'LONG_TEXT', 'DATE'].includes(question.questionType)) {
                    return answer;
                }

                // Find correct options
                const correctOptions = question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.optionText);

                // Re-grade
                let isCorrect = false;
                if (question.questionType === 'MULTIPLE') {
                    const selected = answer.selectedOptions || [];
                    isCorrect = correctOptions.length === selected.length &&
                        correctOptions.every(opt => selected.includes(opt));
                } else {
                    const selected = answer.selectedOptions?.[0];
                    isCorrect = correctOptions.includes(selected);
                }

                const pointsEarned = isCorrect ? (question.points || 1) : 0;
                newTotalScore += pointsEarned;

                if (answer.isCorrect !== isCorrect || answer.pointsEarned !== pointsEarned) {
                    scoreChanged = true;
                }

                return {
                    ...answer.toObject(),
                    questionId: question._id,
                    isCorrect,
                    pointsEarned
                };
            });

            const newPercentage = totalPoints > 0 ? Math.round((newTotalScore / totalPoints) * 100) : 0;
            const newPassed = newPercentage >= (quiz.settings?.passingScore || 60);

            if (response.score !== newTotalScore || response.percentage !== newPercentage) {
                scoreChanged = true;
            }

            if (scoreChanged) {
                fixedCount++;
                const oldScore = `${response.score}/${response.totalPoints} (${response.percentage}%)`;
                const newScore = `${newTotalScore}/${totalPoints} (${newPercentage}%)`;
                console.log(`   🔧 ${response.participantName} (${response.participantRollNo || 'N/A'}): ${oldScore} → ${newScore}`);

                if (!DRY_RUN) {
                    response.answers = newAnswers;
                    response.score = newTotalScore;
                    response.totalPoints = totalPoints;
                    response.percentage = newPercentage;
                    response.passed = newPassed;
                    await response.save();
                }
            } else {
                alreadyCorrectCount++;
            }
        }

        // ─── Summary ───
        console.log('\n' + '━'.repeat(50));
        console.log(`\n📊 Summary for "${quiz.title}":`);
        console.log(`   Total responses: ${responses.length}`);
        console.log(`   Fixed: ${fixedCount}`);
        console.log(`   Already correct: ${alreadyCorrectCount}`);

        if (DRY_RUN) {
            console.log(`\n⚠️  DRY RUN — no changes saved. Run without --dry-run to apply.`);
        } else {
            console.log(`\n✅ All fixes applied. Backup stored in "quizresponses_backup" collection.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

regradeQuiz();
