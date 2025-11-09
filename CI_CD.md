# CI/CD Pipeline Documentation

## 🚀 Overview

This project uses GitHub Actions for continuous integration and deployment. All workflows are automatically triggered on push and pull requests to the main branch.

---

## 📋 Workflows

### 1. **CI Workflow** (`.github/workflows/ci.yml`)

**Triggers:** Push to `main`, Pull Requests to `main`

**Jobs:**
- **Lint & Format Check**: ESLint + Prettier validation
- **Type Check**: TypeScript compiler check (`tsc --noEmit`)
- **Tests**: Vitest with coverage (>60% required)
- **Build**: Production build verification
- **Bundle Size**: Ensures bundles stay within limits (150KB for JS)

**Status:** [![CI](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/username/repo/actions/workflows/ci.yml)

---

### 2. **Lighthouse CI** (`.github/workflows/lighthouse.yml`)

**Triggers:** Push to `main`, Pull Requests to `main`

**Purpose:** Performance, Accessibility, SEO, and Best Practices checks

**Tested URLs:**
- `/` (Homepage)
- `/suche` (Search)
- `/kategorien` (Categories)

**Thresholds:**
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥95
- SEO: ≥95

**Reports:** Available as workflow artifacts for 30 days

---

### 3. **Security Scan** (`.github/workflows/security.yml`)

**Triggers:** 
- Push to `main`
- Pull Requests
- Daily schedule (2 AM)

**Checks:**
- **npm audit**: Moderate+ vulnerability detection
- **CodeQL**: Static code analysis for security issues

**Reports:** Security audit artifacts retained for 90 days

---

### 4. **Deploy** (`.github/workflows/deploy.yml`)

**Environments:**
- **Staging**: Auto-deploys on merge to `main`
- **Production**: Manual trigger with approval

**Staging Deployment:**
```bash
# Automatically runs on push to main
# Includes smoke tests
# Notifications sent on success/failure
```

**Production Deployment:**
```bash
# Manual trigger via GitHub Actions UI
# Requires environment approval
# Runs full test suite before deploy
# Includes health checks after deploy
```

**Rollback Strategy:**
- Failed deployments trigger automatic rollback
- Manual rollback available via GitHub Actions UI
- Previous build artifacts retained for 7 days

---

## 🔒 Branch Protection Rules

### Main Branch (`main`)

**Required Checks:**
- ✅ CI / Lint & Format
- ✅ CI / Type Check
- ✅ CI / Tests (with 60% coverage)
- ✅ CI / Build
- ✅ Lighthouse CI / Performance Check

**Rules:**
- Pull request required before merge
- All status checks must pass
- Conversation resolution required
- Linear history enforced (squash/rebase only)
- No force pushes
- No branch deletion
- Administrators must follow rules

---

## 🌿 Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/user-authentication` |
| `fix/` | Bug fixes | `fix/profile-image-upload` |
| `hotfix/` | Critical production fixes | `hotfix/payment-error` |
| `refactor/` | Code refactoring | `refactor/search-component` |
| `docs/` | Documentation updates | `docs/api-documentation` |

---

## 📦 Dependabot Configuration

**Schedule:** Weekly on Mondays at 2 AM

**Auto-Merge Criteria:**
- Minor/patch updates only
- All CI checks pass
- No security vulnerabilities

**Manual Review Required:**
- Major version updates
- Security advisories
- Breaking changes

---

## 📊 Quality Gates

### Code Coverage
- **Minimum:** 60% (lines, functions, branches, statements)
- **Tool:** Vitest + Codecov
- **Enforcement:** CI fails if coverage drops below threshold

### Bundle Size
- **JavaScript:** ≤150KB per chunk
- **CSS:** ≤30KB total
- **Enforcement:** CI fails if limits exceeded

### Performance Budgets
- **LCP:** ≤2.5s
- **FID/INP:** ≤100ms
- **CLS:** ≤0.1
- **TBT:** ≤300ms

---

## 🔐 Required Secrets

Configure these in GitHub Repository Settings → Secrets and Variables:

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `CODECOV_TOKEN` | Coverage reporting | CI Workflow |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI | Lighthouse Workflow |
| `SLACK_WEBHOOK` | Deployment notifications | Deploy Workflow (optional) |
| `SUPABASE_ACCESS_TOKEN` | Backend deployments | Deploy Workflow (optional) |

---

## 🚨 Troubleshooting

### CI Build Failures

**Lint Errors:**
```bash
# Fix automatically
npm run lint:fix
npm run format
```

**Type Errors:**
```bash
# Check types locally
npm run type-check
```

**Test Failures:**
```bash
# Run tests with UI
npm run test:ui

# Run specific test
npm run test -- ProfileCard.test.tsx
```

**Build Failures:**
```bash
# Test build locally
npm run build

# Check bundle size
npm run build && ls -lh dist/assets/
```

---

### Failed Lighthouse Checks

**Performance Issues:**
- Check bundle size (optimize if needed)
- Review lazy loading implementation
- Verify image optimization

**Accessibility Issues:**
- Run `npm run lint` (ESLint checks accessibility)
- Test with screen reader
- Verify color contrast ratios

---

### Deployment Failures

**Staging Deployment:**
1. Check CI workflow passed
2. Verify build artifacts generated
3. Review smoke test logs
4. Check deployment service status

**Production Deployment:**
1. Ensure all approvals received
2. Verify staging deployment successful
3. Check health checks passed
4. Review error logs if failed

**Rollback Procedure:**
```bash
# Automatic rollback triggers on:
# - Failed smoke tests
# - Health check failures
# - Error rate >5%

# Manual rollback:
# 1. Go to GitHub Actions
# 2. Select "Deploy" workflow
# 3. Click "Re-run jobs" on previous successful deployment
```

---

## 📈 Monitoring & Alerts

### Deployment Notifications

**Slack/Discord Integration:**
- Deployment start/success/failure
- Test failures
- Security vulnerabilities
- Coverage drops

**Configure Webhook:**
```yaml
# Add to repository secrets:
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 🎯 Success Metrics

### Current Targets
- ✅ CI Success Rate: >95%
- ✅ Average PR Merge Time: <24 hours
- ✅ Test Coverage: >60%
- ✅ Lighthouse Performance: >90
- ✅ Zero Critical Security Issues
- ✅ Bundle Size: Within limits

### Review Frequency
- Weekly: Dependabot PRs
- Monthly: Security audits
- Quarterly: Performance review

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Codecov Documentation](https://docs.codecov.com/)
- [Vitest Documentation](https://vitest.dev/)

---

## 🔄 Update History

| Date | Change | Author |
|------|--------|--------|
| 2024-01 | Initial CI/CD setup | Team |
| 2024-01 | Added Lighthouse CI | Team |
| 2024-01 | Configured Dependabot | Team |

---

**For questions or issues, please contact the development team or create an issue in the repository.**
