const fs = require("fs");

const TYPEMOJIS = Object.seal({
  "✨": ["sparkles", "feat", "feature"],
  "🐛": ["bug", "fix", "bugfix"],
  "♻": ["recycle", "refactor"],
  "📝": ["pencil", "docs", "note"],
  "✅": ["white_check_mark", "tests"],
  "🔀": ["twisted_rightwards_arrows", "merge"],
  "✏": ["pencil2", "typo"],
  "🔧": ["wrench", "config"],
  "➕": ["heavy_plus_sign", "add", "plus"],
  "➖": ["heavy_minus_sign", "remove", "minus"],
  "🔖": ["bookmark", "version", "release"],
  "👷": ["construction_worker", "ci"],
  "🚨": ["rotating_light", "lint"],
  "🚑": ["ambulance", "hotfix"],
  "🎉": ["tada"],
});

const commitMessage = fs.readFileSync(process.argv[2]).toString();

let editedCommitMessage = commitMessage;

Object.entries(TYPEMOJIS).forEach(([typemoji, translations]) => {
  translations.forEach(translation => {
    editedCommitMessage = editedCommitMessage.replace(
      `:${translation}:`,
      typemoji
    );
  });
});

fs.writeFileSync(process.argv[2], editedCommitMessage);
