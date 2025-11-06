// src/constants/answerPresets.js
export const ANSWER_PRESETS = [
  { key: 'YES_NO', label: 'Yes - No', type: 'fixed', options: ['Yes', 'No'] },
  { key: 'TRUE_FALSE', label: 'True - False', type: 'fixed', options: ['True', 'False'] },

  // Likert (5-point) families
  {
    key: 'AGREE_DISAGREE',
    label: 'Agree - Disagree',
    type: 'likert5',
    options: ['Strongly agree', 'Agree', 'Neither agree nor disagree', 'Disagree', 'Strongly disagree'],
  },
  {
    key: 'SATISFIED_DISSATISFIED',
    label: 'Satisfied - Dissatisfied',
    type: 'likert5',
    options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
  },
  {
    key: 'LIKELY_UNLIKELY',
    label: 'Likely - Unlikely',
    type: 'likert5',
    options: ['Very likely', 'Likely', 'Neutral', 'Unlikely', 'Very unlikely'],
  },
  {
    key: 'ALWAYS_NEVER',
    label: 'Always - Never',
    type: 'likert5',
    options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'],
  },
  {
    key: 'HIGH_LOW',
    label: 'High quality - Low quality',
    type: 'likert5',
    options: ['Very high quality', 'High quality', 'Neutral', 'Low quality', 'Very low quality'],
  },
  {
    key: 'USEFUL_NOT_USEFUL',
    label: 'Useful - Not useful',
    type: 'likert5',
    options: ['Very useful', 'Useful', 'Neutral', 'Not useful', 'Not useful at all'],
  },
  {
    key: 'VALUABLE_NOT_VALUABLE',
    label: 'Valuable - Not valuable',
    type: 'likert5',
    options: ['Very valuable', 'Valuable', 'Neutral', 'Not valuable', 'Not valuable at all'],
  },
  {
    key: 'CLEAR_NOT_CLEAR',
    label: 'Clear - Not clear',
    type: 'likert5',
    options: ['Very clear', 'Clear', 'Neutral', 'Not clear', 'Very unclear'],
  },
  {
    key: 'HELPFUL_NOT_HELPFUL',
    label: 'Helpful - Not helpful',
    type: 'likert5',
    options: ['Very helpful', 'Helpful', 'Neutral', 'Not helpful', 'Not helpful at all'],
  },
];

// helper to map preset -> [{optionText, value}]
export function buildOptionsFromPreset(presetKey) {
  const preset = ANSWER_PRESETS.find(p => p.key === presetKey);
  if (!preset) return [];
  return preset.options.map(o => ({ optionText: o, value: o }));
}
