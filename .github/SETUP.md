# GitHub Actions CI/CD Setup Guide

## ✅ What's Already Configured

The following files have been created and are ready to use:

- ✅ `.github/workflows/ci.yml` - Main CI pipeline
- ✅ `.github/workflows/lighthouse.yml` - Performance checks
- ✅ `.github/workflows/security.yml` - Security scanning
- ✅ `.github/workflows/deploy.yml` - Deployment automation
- ✅ `.github/dependabot.yml` - Dependency updates
- ✅ `.lighthouserc.json` - Lighthouse CI configuration
- ✅ `.size-limit.json` - Bundle size limits
- ✅ `CI_CD.md` - Complete documentation

## 🔧 Required Manual Configuration

### 1. Add NPM Scripts to `package.json`

Add these scripts to your `package.json` file:

```json
{
  "scripts": {
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "size": "size-limit"
  }
}
```

### 2. Configure GitHub Secrets

Go to **Repository Settings → Secrets and Variables → Actions** and add:

#### Optional but Recommended:
- `CODECOV_TOKEN` - Get from [codecov.io](https://codecov.io) after signing up
- `LHCI_GITHUB_APP_TOKEN` - For Lighthouse CI PR comments (can be skipped for now)

#### For Deployment Notifications (Optional):
- `SLACK_WEBHOOK` - For Slack notifications
- `DISCORD_WEBHOOK` - For Discord notifications

### 3. Update README Badge URLs

In `README.md`, replace `username/repo` with your actual GitHub username and repository name:

```markdown
[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
```

### 4. Configure Branch Protection Rules

Go to **Repository Settings → Branches → Add rule** for `main`:

1. ✅ Require a pull request before merging
2. ✅ Require status checks to pass before merging:
   - `lint-and-format`
   - `type-check`
   - `test`
   - `build`
   - `lighthouse` (optional, can add later)
3. ✅ Require conversation resolution before merging
4. ✅ Require linear history
5. ✅ Do not allow bypassing the above settings

### 5. Update Dependabot Configuration

In `.github/dependabot.yml`, replace `your-github-username` with your actual username:

```yaml
reviewers:
  - "your-actual-username"
```

### 6. Test the Pipeline

Create a test branch and PR:

```bash
git checkout -b test/ci-pipeline
git add .
git commit -m "test: CI/CD pipeline setup"
git push origin test/ci-pipeline
```

Then create a pull request and watch the workflows run!

## 🚀 What Happens Automatically

### On Every Push/PR:
1. **Linting & Formatting** checks run
2. **TypeScript** type checking
3. **Tests** run with coverage reports
4. **Build** is verified
5. **Bundle size** is checked
6. **Lighthouse CI** runs performance tests
7. **Security audit** checks dependencies

### On Merge to Main:
1. All CI checks pass
2. **Staging deployment** triggers automatically
3. Smoke tests verify deployment
4. Notifications sent (if configured)

### Production Deployment:
- Manual trigger via GitHub Actions UI
- Requires approval in "Environments" settings
- Full test suite runs before deploy
- Health checks after deployment

## 📊 Monitoring

### View Workflow Runs:
1. Go to **Actions** tab in your repository
2. See all workflow runs and their status
3. Click any workflow to see detailed logs

### Check Coverage:
- Coverage reports are generated in CI
- Can be uploaded to Codecov for tracking

### Bundle Size:
- Automatically checked on each build
- Fails if JS bundles exceed 150KB
- Fails if CSS exceeds 30KB

## 🔥 Quick Commands

```bash
# Run all checks locally (like CI does)
npm run lint
npm run type-check
npm run test:run
npm run build

# Fix formatting issues
npm run format

# Check bundle size
npm run build && npm run size
```

## ❗ Important Notes

1. **First Pipeline Run**: The first workflow run may fail if secrets aren't configured. This is normal - configure the secrets and re-run.

2. **Lighthouse CI**: May fail initially on slower networks. You can adjust thresholds in `.lighthouserc.json` if needed.

3. **Coverage**: Currently set to 60% minimum. Adjust in `vitest.config.ts` if needed.

4. **Deployment**: The deploy workflow has placeholder commands. Add your actual deployment commands (Vercel, Netlify, Lovable deploy, etc.).

## 🆘 Troubleshooting

### Workflows not running?
- Check that workflow files are in `.github/workflows/` directory
- Verify YAML syntax is correct
- Ensure branch protection rules allow workflows

### CI failing unexpectedly?
- Check the "Actions" tab for error logs
- Run the same commands locally to reproduce
- Review the "CI_CD.md" troubleshooting section

### Need help?
- See `CI_CD.md` for detailed documentation
- Check GitHub Actions logs for specific errors
- Review the [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Ready to go! 🎉** Your CI/CD pipeline is set up. Make a test PR to see it in action!
