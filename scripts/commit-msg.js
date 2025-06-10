const fs = require('fs');

// Enhanced emoji mapping with conventional commit types
const COMMIT_TYPES = Object.freeze({
  // Features and improvements
  '✨': { conventional: 'feat', aliases: ['sparkles', 'feat', 'feature', 'new'], description: 'New feature' },
  '🚀': { conventional: 'feat', aliases: ['rocket', 'launch', 'deploy'], description: 'Performance improvement' },
  '⚡': { conventional: 'perf', aliases: ['zap', 'perf', 'performance'], description: 'Performance improvement' },

  // Bug fixes
  '🐛': { conventional: 'fix', aliases: ['bug', 'fix', 'bugfix'], description: 'Bug fix' },
  '🚑️': { conventional: 'fix', aliases: ['ambulance', 'hotfix', 'critical'], description: 'Critical hotfix' },
  '🩹': { conventional: 'fix', aliases: ['adhesive_bandage', 'patch'], description: 'Simple fix' },

  // Code quality
  '♻️': { conventional: 'refactor', aliases: ['recycle', 'refactor', 'cleanup'], description: 'Code refactoring' },
  '🎨': { conventional: 'style', aliases: ['art', 'style', 'format'], description: 'Code style/formatting' },
  '💥': { conventional: 'feat', aliases: ['boom', 'breaking'], description: 'Breaking change' },

  // Documentation
  '📝': { conventional: 'docs', aliases: ['memo', 'docs', 'documentation'], description: 'Documentation' },
  '💡': { conventional: 'docs', aliases: ['bulb', 'comment'], description: 'Add/update comments' },

  // Testing
  '✅': { conventional: 'test', aliases: ['white_check_mark', 'tests', 'test'], description: 'Add/update tests' },
  '🧪': { conventional: 'test', aliases: ['test_tube', 'experiment'], description: 'Experimental features' },

  // Dependencies and configuration
  '➕': { conventional: 'build', aliases: ['heavy_plus_sign', 'add', 'dependency'], description: 'Add dependency' },
  '➖': { conventional: 'build', aliases: ['heavy_minus_sign', 'remove', 'dependency'], description: 'Remove dependency' },
  '⬆️': { conventional: 'build', aliases: ['arrow_up', 'upgrade'], description: 'Upgrade dependencies' },
  '⬇️': { conventional: 'build', aliases: ['arrow_down', 'downgrade'], description: 'Downgrade dependencies' },
  '📌': { conventional: 'build', aliases: ['pushpin', 'pin'], description: 'Pin dependencies' },
  '🔧': { conventional: 'chore', aliases: ['wrench', 'config', 'configure'], description: 'Configuration' },

  // CI/CD and tooling
  '👷': { conventional: 'ci', aliases: ['construction_worker', 'ci', 'build'], description: 'CI/CD' },
  '💚': { conventional: 'ci', aliases: ['green_heart', 'fix-ci'], description: 'Fix CI build' },
  '🚨': { conventional: 'style', aliases: ['rotating_light', 'lint', 'warning'], description: 'Fix linter warnings' },

  // Release and versioning
  '🔖': { conventional: 'chore', aliases: ['bookmark', 'version', 'release', 'tag'], description: 'Release/version' },

  // Git operations
  '🔀': { conventional: 'merge', aliases: ['twisted_rightwards_arrows', 'merge'], description: 'Merge branches' },
  '⏪': { conventional: 'revert', aliases: ['rewind', 'revert'], description: 'Revert changes' },

  // Security
  '🔒️': { conventional: 'fix', aliases: ['lock', 'security'], description: 'Security fix' },
  '🔐': { conventional: 'feat', aliases: ['closed_lock_with_key', 'auth'], description: 'Add authentication' },

  // Minor fixes
  '✏️': { conventional: 'fix', aliases: ['pencil2', 'typo'], description: 'Fix typos' },
  '🚸': { conventional: 'fix', aliases: ['children_crossing', 'ux'], description: 'Improve UX/accessibility' },

  // Initial commit
  '🎉': { conventional: 'feat', aliases: ['tada', 'init', 'initial'], description: 'Initial commit' },
});

/**
 * Check if text starts with an emoji
 */
function startsWithEmoji(text) {
  // Simple check for common emoji ranges
  const emojiRanges = [
    /^[\u2600-\u26FF]/, // Miscellaneous Symbols
    /^[\u2700-\u27BF]/, // Dingbats
    /^[\u{1F300}-\u{1F5FF}]/u, // Miscellaneous Symbols and Pictographs
    /^[\u{1F600}-\u{1F64F}]/u, // Emoticons
    /^[\u{1F680}-\u{1F6FF}]/u, // Transport and Map
    /^[\u{1F700}-\u{1F77F}]/u, // Alchemical Symbols
    /^[\u{1F780}-\u{1F7FF}]/u, // Geometric Shapes Extended
    /^[\u{1F800}-\u{1F8FF}]/u, // Supplemental Arrows-C
    /^[\u{1F900}-\u{1F9FF}]/u, // Supplemental Symbols and Pictographs
  ];

  return emojiRanges.some(range => range.test(text));
}

/**
 * Show helpful information about available emojis
 */
function showHelp() {
  console.log('\n📋 Available commit types:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  Object.entries(COMMIT_TYPES).forEach(([emoji, config]) => {
    console.log(
      `${emoji}  ${config.description.padEnd(25)} (${config.aliases
        .slice(0, 3)
        .map(a => `:${a}:`)
        .join(', ')})`,
    );
  });

  console.log('\n💡 Examples:');
  console.log('  ✨ add user authentication');
  console.log('  🐛 fix login redirect issue');
  console.log('  📝 update installation docs');
  console.log('  :feat: add user authentication');
  console.log('  feat: add user authentication');
}

/**
 * Enhanced commit message processor with better error handling and validation
 */
class CommitMessageProcessor {
  constructor(messageFile) {
    this.messageFile = messageFile;
    this.originalMessage = '';
    this.processedMessage = '';
  }

  /**
   * Read the commit message from file
   */
  readMessage() {
    try {
      this.originalMessage = fs.readFileSync(this.messageFile, 'utf8').trim();
      this.processedMessage = this.originalMessage;
      return true;
    } catch (error) {
      console.error('❌ Error reading commit message file:', error.message);
      return false;
    }
  }

  /**
   * Process emoji aliases and convert to actual emojis
   */
  processEmojiAliases() {
    let hasChanges = false;

    Object.entries(COMMIT_TYPES).forEach(([emoji, config]) => {
      config.aliases.forEach(alias => {
        const aliasPattern = new RegExp(`:${alias}:`, 'gi');
        if (this.processedMessage.match(aliasPattern)) {
          this.processedMessage = this.processedMessage.replace(aliasPattern, emoji);
          hasChanges = true;
        }
      });
    });

    return hasChanges;
  }

  /**
   * Convert conventional commit format to emoji format
   */
  convertConventionalToEmoji() {
    const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert|merge|hotfix)(\([^)]+\))?:\s*(.+)/;
    const match = this.processedMessage.match(conventionalPattern);

    if (!match) return false;

    const [, type, scope, subject] = match;

    // Find emoji for conventional type
    const emojiEntry = Object.entries(COMMIT_TYPES).find(([, config]) => config.conventional === type);

    if (emojiEntry) {
      const [emoji] = emojiEntry;
      const scopePart = scope ? `(${scope.slice(1, -1)}) ` : '';
      this.processedMessage = this.processedMessage.replace(conventionalPattern, `${emoji} ${scopePart}${subject}`);
      return true;
    }

    return false;
  }

  /**
   * Validate the processed message
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Check length
    if (this.processedMessage.length < 10) {
      errors.push('Commit message too short (minimum 10 characters)');
    }
    if (this.processedMessage.length > 100) {
      errors.push('Commit message too long (maximum 100 characters)');
    }

    // Check if it starts with an emoji or conventional type
    const startsWithEmojiResult = startsWithEmoji(this.processedMessage);
    const startsWithConventional = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert|merge|hotfix)/.test(this.processedMessage);

    if (!startsWithEmojiResult && !startsWithConventional) {
      warnings.push('Consider starting with an emoji or conventional type (feat:, fix:, etc.)');
    }

    // Check for proper capitalization (should be lowercase after emoji/type)
    const afterPrefix = this.processedMessage.replace(/^(?:[\u2600-\u26FF\u2700-\u27BF]|[\u{1F300}-\u{1F9FF}])+\s*/u, '');
    const cleanAfterPrefix = afterPrefix.replace(/^\w+(?:\([^)]+\))?:\s*/, '');

    if (cleanAfterPrefix && cleanAfterPrefix[0] !== cleanAfterPrefix[0].toLowerCase()) {
      warnings.push('Subject should start with lowercase letter');
    }

    // Check for trailing period
    if (this.processedMessage.endsWith('.')) {
      warnings.push('Remove trailing period from subject');
    }

    return { errors, warnings };
  }

  /**
   * Write the processed message back to file
   */
  writeMessage() {
    try {
      fs.writeFileSync(this.messageFile, this.processedMessage);
      return true;
    } catch (error) {
      console.error('❌ Error writing commit message file:', error.message);
      return false;
    }
  }

  /**
   * Main processing function
   */
  process() {
    if (!this.readMessage()) {
      return false;
    }

    // Skip processing for merge commits, revert commits, etc.
    if (
      this.originalMessage.startsWith('Merge ') ||
      this.originalMessage.startsWith('Revert ') ||
      this.originalMessage.startsWith('fixup!') ||
      this.originalMessage.startsWith('squash!')
    ) {
      return true;
    }

    let hasChanges = false;

    // Process emoji aliases
    if (this.processEmojiAliases()) {
      hasChanges = true;
      console.log('✅ Converted emoji aliases to emojis');
    }

    // Convert conventional commits to emoji format
    if (this.convertConventionalToEmoji()) {
      hasChanges = true;
      console.log('✅ Converted conventional commit to emoji format');
    }

    // Validate the message
    const { errors, warnings } = this.validate();

    if (errors.length > 0) {
      console.error('\n❌ Commit message errors:');
      errors.forEach(error => console.error(`  • ${error}`));
      showHelp();
      return false;
    }

    if (warnings.length > 0) {
      console.warn('\n⚠️  Commit message suggestions:');
      warnings.forEach(warning => console.warn(`  • ${warning}`));
    }

    // Write changes if any
    if (hasChanges) {
      if (!this.writeMessage()) {
        return false;
      }
      console.log(`📝 Updated commit message: "${this.processedMessage}"`);
    }

    return true;
  }
}

// Main execution
if (require.main === module) {
  const messageFile = process.argv[2];

  if (!messageFile) {
    console.error('❌ Usage: node commit-msg.js <commit-message-file>');
    process.exit(1);
  }

  const processor = new CommitMessageProcessor(messageFile);

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const success = processor.process();
  process.exit(success ? 0 : 1);
}

module.exports = CommitMessageProcessor;
