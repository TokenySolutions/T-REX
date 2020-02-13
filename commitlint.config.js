module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(.*)\((.*)\) (.*)$/,
      headerCorrespondence: ['type', 'scope', 'message'],
    },
  },
  rules: {
    'scope-empty': [1, 'never'],
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', ['✨', '🐛', '♻', '✅', '📝', '🔀', '✏', '🔧', '➕', '➖', '🔖', '👷', '🚨', '🚑', '🎉']],
  },
};
