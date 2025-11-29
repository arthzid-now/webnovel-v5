# Changelog

All notable changes to Inkvora will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Credit/quota indicator in Story Setup header (in progress)
- Scrollable Universe Library with clickable cards (in progress)

### Fixed
- Translation keys showing as placeholders (e.g., `setup.spark.untitledStory`)

---

## [0.5.0] - 2025-11-29

### Added
- **"Skip Setup & Start Writing" button** - Manual writers can now bypass full Story Encyclopedia setup and jump directly to Writing Studio
- Translation support for "Untitled Story" in both English and Indonesian

### Fixed
- **AI Assistant "ContentUnion is required" error** - Fixed by properly formatting inputs as strings for Google GenAI SDK v1.29.1
- **Subscription persistence issue** - User premium status now correctly persists after page refresh
- **Editor Tools not working for Free Tier** - Fixed quota checking and error handling
- **Chat sending `[object Object]`** - Fixed message formatting in chat input

### Changed
- Updated AI models to Gemini 2.5/3.0 Flash for better performance
- Improved error messages and user feedback across the app

---

## [0.4.0] - 2025-11-28

### Added
- Firebase Authentication with Google OAuth
- Cloud Firestore sync for premium users
- Premium tier with unlimited AI generations
- Auto Architect feature (Premium) for rapid story generation

### Fixed
- Various UI translation issues
- Model selection not persisting

---

## [0.3.0] - 2025-11-27

### Added
- Universe Hub for managing reusable world-building templates
- Universe Library integration in Story Setup
- Export/Import stories in JSON and Markdown formats
- Chapter History & Versioning

### Changed
- Improved Writing Studio layout and UX
- Better mobile responsiveness

---

## [0.2.0] - 2025-11-26

### Added
- AI Magic Tools: Rewrite, Expand, Fix Grammar, Beat-to-Prose
- Chapter Analysis feature
- Global Search & Replace across all chapters
- Thinking Mode (Pro feature) for extended AI reasoning

### Fixed
- Editor toolbar button states
- Word count accuracy

---

## [0.1.0] - 2025-11-25

### Added
- Initial release
- Story Encyclopedia Setup with AI-assisted generation
- Writing Studio with rich text editor
- AI Assistant Chat with context awareness
- IndexedDB local storage
- PWA support (offline-first)
- Bilingual support (English/Indonesian)

---

## How to Update This Changelog

### When deploying changes:

1. **Move items from [Unreleased] to a new version section**
2. **Add deployment date**
3. **Follow this format:**

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing features

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security fixes
```

### Version Numbering (Semantic Versioning):
- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backwards-compatible
- **Patch (0.0.X)**: Bug fixes, small improvements

---

## Links
- [Live App](https://your-firebase-url.web.app)
- [GitHub Repository](https://github.com/arthzid-now/webnovel-v5)
