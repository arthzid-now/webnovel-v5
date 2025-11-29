#!/usr/bin/env node

/**
 * Auto-generate CHANGELOG.md and changelog.json from git commits
 * 
 * Usage: node scripts/generate-changelog.js
 * 
 * Expects conventional commit format:
 * - feat: New feature
 * - fix: Bug fix
 * - chore: Maintenance (hidden)
 * - docs: Documentation (hidden)
 * - refactor: Code refactoring
 * - perf: Performance improvement
 * - style: UI/UX improvements
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const CHANGELOG_JSON_PATH = path.join(__dirname, '..', 'public', 'changelog.json');
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

// Read current version from package.json
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
const currentVersion = packageJson.version || '0.0.0';

// Get git commits since last tag
function getCommitsSinceLastTag() {
    try {
        // Get last git tag
        const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();

        // Get commits since last tag (or all if no tags)
        const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
        const commits = execSync(`git log ${range} --pretty=format:"%H|%s|%b|%an|%ad" --date=short`, { encoding: 'utf8' });

        return commits.split('\n').filter(line => line.trim()).map(line => {
            const [hash, subject, body, author, date] = line.split('|');
            return { hash, subject, body, author, date };
        });
    } catch (error) {
        console.error('Error getting git commits:', error.message);
        return [];
    }
}

// Parse conventional commit
function parseCommit(commit) {
    const conventionalRegex = /^(feat|fix|chore|docs|refactor|perf|style|test|build|ci)(\(.+\))?:\s*(.+)$/;
    const match = commit.subject.match(conventionalRegex);

    if (!match) {
        return { type: 'other', scope: null, message: commit.subject };
    }

    const [, type, scope, message] = match;
    return {
        type,
        scope: scope ? scope.slice(1, -1) : null,
        message,
        body: commit.body,
        hash: commit.hash.substring(0, 7),
        author: commit.author,
        date: commit.date
    };
}

// Categorize commits
function categorizeCommits(commits) {
    const categories = {
        added: [],
        changed: [],
        fixed: [],
        removed: [],
        security: [],
        deprecated: []
    };

    commits.forEach(commit => {
        const parsed = parseCommit(commit);

        // Skip chore, docs, test, build, ci commits
        if (['chore', 'docs', 'test', 'build', 'ci'].includes(parsed.type)) {
            return;
        }

        const entry = parsed.scope
            ? `**${parsed.scope}**: ${parsed.message}`
            : parsed.message;

        switch (parsed.type) {
            case 'feat':
                categories.added.push(entry);
                break;
            case 'fix':
                categories.fixed.push(entry);
                break;
            case 'refactor':
            case 'perf':
            case 'style':
                categories.changed.push(entry);
                break;
            default:
                // Other types go to changed
                categories.changed.push(entry);
        }
    });

    return categories;
}

// Generate CHANGELOG.md content
function generateMarkdown(version, date, categories) {
    let content = `# Changelog\n\n`;
    content += `All notable changes to Inkvora will be documented in this file.\n\n`;
    content += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
    content += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

    // Unreleased section
    content += `## [Unreleased]\n\n`;

    // Current version
    content += `## [${version}] - ${date}\n\n`;

    if (categories.added.length > 0) {
        content += `### Added\n`;
        categories.added.forEach(item => content += `- ${item}\n`);
        content += `\n`;
    }

    if (categories.changed.length > 0) {
        content += `### Changed\n`;
        categories.changed.forEach(item => content += `- ${item}\n`);
        content += `\n`;
    }

    if (categories.fixed.length > 0) {
        content += `### Fixed\n`;
        categories.fixed.forEach(item => content += `- ${item}\n`);
        content += `\n`;
    }

    if (categories.deprecated.length > 0) {
        content += `### Deprecated\n`;
        categories.deprecated.forEach(item => content += `- ${item}\n`);
        content += `\n`;
    }

    if (categories.removed.length > 0) {
        content += `### Removed\n`;
        categories.removed.forEach(item => content += `- ${item}\n`);
        content += `\n`;
    }

    if (categories.security.length > 0) {
        content += `### Security\n`;
        categories.security.forEach(item => content += `- ${item}\n`);
        content += `\n`;
    }

    content += `---\n\n`;
    content += `## How to Use Conventional Commits\n\n`;
    content += `Format: \`<type>(<scope>): <subject>\`\n\n`;
    content += `**Types**:\n`;
    content += `- \`feat\`: New feature → Added\n`;
    content += `- \`fix\`: Bug fix → Fixed\n`;
    content += `- \`refactor\`: Code refactoring → Changed\n`;
    content += `- \`perf\`: Performance improvement → Changed\n`;
    content += `- \`style\`: UI/UX improvements → Changed\n`;
    content += `- \`chore\`: Maintenance (hidden from changelog)\n`;
    content += `- \`docs\`: Documentation (hidden from changelog)\n\n`;
    content += `**Example**:\n\`\`\`bash\n`;
    content += `git commit -m "feat(setup): add Skip Setup button"\n`;
    content += `\`\`\`\n`;

    return content;
}

// Generate changelog.json for in-app consumption
function generateJSON(version, date, categories) {
    return {
        version,
        date,
        changes: {
            added: categories.added,
            changed: categories.changed,
            fixed: categories.fixed,
            deprecated: categories.deprecated,
            removed: categories.removed,
            security: categories.security
        }
    };
}

// Main function
function main() {
    console.log('🔄 Generating changelog from git commits...\n');

    // Get commits
    const commits = getCommitsSinceLastTag();
    console.log(`📝 Found ${commits.length} commits since last tag\n`);

    if (commits.length === 0) {
        console.log('⚠️  No new commits found. Skipping changelog generation.');
        return;
    }

    // Categorize commits
    const categories = categorizeCommits(commits);

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0];

    // Generate markdown
    const markdownContent = generateMarkdown(currentVersion, currentDate, categories);
    fs.writeFileSync(CHANGELOG_PATH, markdownContent, 'utf8');
    console.log(`✅ CHANGELOG.md updated`);

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Generate JSON
    const jsonContent = generateJSON(currentVersion, currentDate, categories);
    fs.writeFileSync(CHANGELOG_JSON_PATH, JSON.stringify(jsonContent, null, 2), 'utf8');
    console.log(`✅ changelog.json created in public/`);

    console.log(`\n✨ Changelog generated successfully for version ${currentVersion}!`);
}

// Run
main();
