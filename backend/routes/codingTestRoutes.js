import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import CodingTest from '../models/CodingTest.js';
import CodingTestResponse from '../models/CodingTestResponse.js';

const router = express.Router();

// Create coding test
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, questions, settings, classes, isScheduled, startAt, endAt, timeZone } = req.body || {};
    const test = new CodingTest({
      title,
      description,
      questions: questions || [],
      settings: settings || {},
      classes: classes || [],
      creator: req.user._id,
      isScheduled: !!isScheduled,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      timeZone: timeZone || 'UTC',
    });
    const created = await test.save();
    res.status(201).json(created);
  } catch (err) {
    console.error('Create coding test error', err);
    const isValidation = err.name === 'ValidationError';
    res.status(isValidation ? 400 : 500).json({
      message: isValidation ? err.message : 'Error creating coding test',
      errors: isValidation ? err.errors : undefined,
    });
  }
});

// List coding tests for creator
router.get('/', protect, async (req, res) => {
  try {
    const tests = await CodingTest.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching coding tests' });
  }
});

// Get single coding test (creator)
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (test.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching coding test' });
  }
});

// Update coding test
router.put('/:id', protect, async (req, res) => {
  try {
    const updates = req.body || {};
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (test.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(test, updates);
    const saved = await test.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error updating coding test' });
  }
});

// Delete coding test
router.delete('/:id', protect, async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (test.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await CodingTestResponse.deleteMany({ codingTest: req.params.id });
    await test.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting coding test' });
  }
});

// Publish/unpublish
router.put('/:id/publish', protect, async (req, res) => {
  try {
    const { isPublished } = req.body;
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (test.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    test.isPublished = !!isPublished;
    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: 'Error updating publish state' });
  }
});

// Public fetch
router.get('/public/:id', async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (!test.isPublished) return res.status(403).json({ message: 'This test is not available' });

    if (test.isScheduled) {
      const now = new Date();
      if (test.startAt && now < test.startAt) {
        return res.status(403).json({
          message: 'This test is scheduled for a future time',
          isScheduled: true,
          startAt: test.startAt,
          endAt: test.endAt || null,
          timeZone: test.timeZone || 'UTC',
        });
      }
      if (test.endAt && now > test.endAt) {
        return res.status(403).json({
          message: 'This test has ended',
          isScheduled: true,
          startAt: test.startAt || null,
          endAt: test.endAt,
          timeZone: test.timeZone || 'UTC',
        });
      }
    }

    const safe = {
      _id: test._id,
      title: test.title,
      description: test.description,
      classes: test.classes || [],
      isScheduled: !!test.isScheduled,
      startAt: test.startAt || null,
      endAt: test.endAt || null,
      timeZone: test.timeZone || 'UTC',
      settings: test.settings,
      questions: test.questions.map((q) => ({
        _id: q._id,
        title: q.title,
        prompt: q.prompt,
        starterCode: q.starterCode,
        language: q.language,
        points: q.points,
        timeLimitMs: q.timeLimitMs,
        testCases: test.settings?.showExpectedOutputs === false
          ? q.testCases.map((t) => ({ input: t.input }))
          : q.testCases,
      })),
      totalPoints: test.questions.reduce((sum, q) => sum + (q.points || 1), 0),
    };

    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching coding test' });
  }
});

// Check roll number
router.post('/check-rollno/:id', async (req, res) => {
  try {
    const { rollNo } = req.body;
    if (!rollNo || !rollNo.trim()) return res.json({ exists: false });
    const test = await CodingTest.findById(req.params.id);
    if (!test || !test.settings?.preventDuplicateRollNo) return res.json({ exists: false });
    const existing = await CodingTestResponse.findOne({ codingTest: req.params.id, participantRollNo: rollNo.trim() });
    if (existing) return res.json({ exists: true, message: `Response already recorded for roll no "${rollNo}"` });
    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: 'Error checking roll number' });
  }
});

// Submit coding test result
router.post('/submit/:id', async (req, res) => {
  try {
    const { submissions = [], participantName, participantEmail, participantClass, participantRollNo, timeTaken, startedAt, autoSubmittedDueToTabSwitch, autoSubmittedDueToFullscreenExit, autoSubmittedDueToSplitScreen } = req.body || {};
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (!test.isPublished) return res.status(403).json({ message: 'This test is not available' });

    if (test.isScheduled) {
      const now = new Date();
      if (test.startAt && now < test.startAt) {
        return res.status(403).json({ message: 'This test is scheduled for a future time', isScheduled: true, startAt: test.startAt, endAt: test.endAt || null, timeZone: test.timeZone || 'UTC' });
      }
      if (test.endAt && now > test.endAt) {
        return res.status(403).json({ message: 'This test has ended', isScheduled: true, startAt: test.startAt || null, endAt: test.endAt, timeZone: test.timeZone || 'UTC' });
      }
    }

    if (test.settings?.preventDuplicateRollNo && participantRollNo && participantRollNo.trim()) {
      const existing = await CodingTestResponse.findOne({ codingTest: req.params.id, participantRollNo: participantRollNo.trim() });
      if (existing) {
        return res.status(400).json({ message: `Response already recorded for roll no "${participantRollNo}"`, rollNoExists: true });
      }
    }

    let totalScore = 0;
    const totalPoints = test.totalPoints || 0;

    const graded = submissions.map((sub) => {
      const q = test.questions.find((qq) => qq._id.toString() === (sub.questionId || '').toString());
      const passAll = (sub.results || []).every((r) => r.pass);
      const pointsEarned = passAll ? (q?.points || 1) : 0;
      totalScore += pointsEarned;
      return {
        questionId: sub.questionId,
        code: sub.code,
        passedCount: sub.passedCount || 0,
        totalTests: sub.totalTests || 0,
        pointsEarned,
        results: sub.results || [],
      };
    });

    const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    const passed = percentage >= (test.settings?.passingScore || 60);

    const resp = new CodingTestResponse({
      codingTest: test._id,
      participantName: participantName || 'Anonymous',
      participantEmail,
      participantClass: participantClass || '',
      participantRollNo: participantRollNo || '',
      submissions: graded,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      timeTaken,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      autoSubmittedDueToTabSwitch: !!autoSubmittedDueToTabSwitch,
      autoSubmittedDueToFullscreenExit: !!autoSubmittedDueToFullscreenExit,
      autoSubmittedDueToSplitScreen: !!autoSubmittedDueToSplitScreen,
    });

    await resp.save();
    test.attemptCount += 1;
    await test.save();

    res.status(201).json({
      _id: resp._id,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      submissions: graded,
    });
  } catch (err) {
    console.error('Submit coding test error', err);
    res.status(500).json({ message: 'Error submitting coding test' });
  }
});

// Analytics
router.get('/analytics/:id', protect, async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Coding test not found' });
    if (test.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const responses = await CodingTestResponse.find({ codingTest: req.params.id }).sort({ submittedAt: -1 });
    const totalResponses = responses.length;
    const passedCount = responses.filter((r) => r.passed).length;
    const avgScore = totalResponses > 0 ? Math.round(responses.reduce((sum, r) => sum + r.percentage, 0) / totalResponses) : 0;
    const avgTime = totalResponses > 0 ? Math.round(responses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / totalResponses) : 0;

    const questionStats = test.questions.map((q) => {
      const attempts = responses.flatMap((r) => r.submissions.filter((s) => s.questionId.toString() === q._id.toString()));
      const correctCount = attempts.filter((a) => (a.results || []).every((res) => res.pass)).length;
      return {
        questionId: q._id,
        title: q.title,
        totalAttempts: attempts.length,
        correctCount,
        accuracy: attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0,
      };
    });

    const classSet = [...new Set(responses.map((r) => r.participantClass).filter(Boolean))];
    const classStats = classSet.map((cls) => {
      const classResponses = responses.filter((r) => r.participantClass === cls);
      const classPassed = classResponses.filter((r) => r.passed).length;
      const classAvgScore = classResponses.length > 0 ? Math.round(classResponses.reduce((sum, r) => sum + r.percentage, 0) / classResponses.length) : 0;
      return { className: cls, totalResponses: classResponses.length, passedCount: classPassed, avgScore: classAvgScore };
    });

    res.json({
      test: { _id: test._id, title: test.title, totalPoints: test.totalPoints, classes: test.classes || [] },
      analytics: {
        totalResponses,
        passedCount,
        failedCount: totalResponses - passedCount,
        passRate: totalResponses > 0 ? Math.round((passedCount / totalResponses) * 100) : 0,
        avgScore,
        avgTime,
      },
      classStats,
      questionStats,
      recentResponses: responses.map((r) => ({
        _id: r._id,
        participantName: r.participantName,
        participantClass: r.participantClass,
        participantRollNo: r.participantRollNo,
        score: r.score,
        totalPoints: r.totalPoints,
        percentage: r.percentage,
        passed: r.passed,
        timeTaken: r.timeTaken,
        submittedAt: r.submittedAt,
        autoSubmittedDueToTabSwitch: r.autoSubmittedDueToTabSwitch,
        autoSubmittedDueToFullscreenExit: r.autoSubmittedDueToFullscreenExit,
        autoSubmittedDueToSplitScreen: r.autoSubmittedDueToSplitScreen,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

export default router;
