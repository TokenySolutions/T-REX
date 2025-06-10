module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // Enhanced regex to support both emoji and conventional formats
      headerPattern: /^(?:(✨|🐛|♻️|✅|📝|🔀|✏️|🔧|➕|➖|🔖|👷|🚨|🚑️|🎉|💥|🔒️|⬆️|⬇️|📌|🚀)\s+(.+)|(\w+)(?:\(([^)]+)\))?\s*:\s*(.+))$/,
      headerCorrespondence: ['emoji', 'emojiSubject', 'type', 'scope', 'subject'],
    },
  },
  rules: {
    // Header rules
    'header-max-length': [2, 'always', 100],
    'header-min-length': [2, 'always', 10],
    'header-case': [0], // Disabled for emoji compatibility

    // Subject rules - conditionally applied
    'subject-empty': [0], // Handled by custom rule
    'subject-min-length': [0], // Handled by custom rule
    'subject-max-length': [2, 'always', 80],
    'subject-case': [0], // Handled by custom rule
    'subject-full-stop': [2, 'never', '.'],

    // Type rules - conditionally applied
    'type-empty': [0], // Handled by custom rule
    'type-case': [2, 'always', 'lower-case'],
    'type-enum': [0], // Handled by custom rule

    // Scope rules
    'scope-case': [2, 'always', 'lower-case'],
    'scope-max-length': [2, 'always', 20],

    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Footer rules
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],

    // Custom rules
    'emoji-type-validation': [2, 'always'],
    'subject-validation': [2, 'always'],
    'references-empty': [1, 'never'],
  },
  plugins: [
    {
      rules: {
        'emoji-type-validation': parsed => {
          const { emoji, type, emojiSubject, subject } = parsed;

          // Emoji format validation
          if (emoji && emojiSubject) {
            const validEmojis = [
              '✨',
              '🐛',
              '♻️',
              '✅',
              '📝',
              '🔀',
              '✏️',
              '🔧',
              '➕',
              '➖',
              '🔖',
              '👷',
              '🚨',
              '🚑️',
              '🎉',
              '💥',
              '🔒️',
              '⬆️',
              '⬇️',
              '📌',
              '🚀',
            ];
            if (!validEmojis.includes(emoji)) {
              return [false, `Invalid emoji "${emoji}". Allowed emojis: ${validEmojis.join(', ')}`];
            }
            return [true];
          }

          // Conventional format validation
          if (type && subject) {
            const validTypes = [
              'feat',
              'fix',
              'docs',
              'style',
              'refactor',
              'test',
              'chore',
              'perf',
              'ci',
              'build',
              'revert',
              'merge',
              'hotfix',
              'release',
            ];
            if (!validTypes.includes(type)) {
              return [false, `Invalid type "${type}". Allowed types: ${validTypes.join(', ')}`];
            }
            return [true];
          }

          return [false, 'Commit message must follow either emoji format (🎉 description) or conventional format (type: description)'];
        },

        'subject-validation': parsed => {
          const { type, emojiSubject, subject } = parsed;

          const actualSubject = emojiSubject || subject;

          if (!actualSubject) {
            return [false, 'Subject may not be empty'];
          }

          if (actualSubject.length < 3) {
            return [false, 'Subject must be at least 3 characters long'];
          }

          // Check case - should be lowercase for conventional, flexible for emoji
          if (type && subject) {
            // Conventional format - enforce lowercase
            if (subject[0] !== subject[0].toLowerCase()) {
              return [false, 'Subject must start with lowercase letter in conventional format'];
            }
          }

          return [true];
        },

        'references-empty': parsed => {
          const { body, footer } = parsed;
          const text = [body, footer].filter(Boolean).join('\n');
          // eslint-disable-next-line max-len
          const hasReference = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i.test(text) || /#\d+/.test(text) || /\b[A-Z]+-\d+\b/.test(text); // JIRA-style

          return [hasReference, hasReference ? '' : 'Consider adding issue reference (e.g., "fixes #123", "closes #456", or "refs PROJ-789")'];
        },
      },
    },
  ],

  // Emoji to conventional type mapping for semantic understanding
  emojiMapping: {
    '✨': 'feat', // new feature
    '🐛': 'fix', // bug fix
    '📝': 'docs', // documentation
    '💄': 'style', // styling
    '♻️': 'refactor', // refactoring
    '✅': 'test', // testing
    '🔧': 'chore', // chore/maintenance
    '⚡': 'perf', // performance
    '👷': 'ci', // continuous integration
    '📦': 'build', // build system
    '⏪': 'revert', // revert changes
    '🔀': 'merge', // merge
    '🚑': 'hotfix', // critical hotfix
    '🔖': 'release', // release/version tags
    '🚀': 'deploy', // deployment
    '🔒': 'security', // security fixes
    '⬆️': 'upgrade', // dependency upgrades
    '⬇️': 'downgrade', // dependency downgrades
    '📌': 'pin', // pin dependencies
    '🎉': 'init', // initial commit
    '💥': 'breaking', // breaking changes
  },
};
