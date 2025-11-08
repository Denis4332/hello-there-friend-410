# Testing Guide

## Setup

Das Projekt nutzt **Vitest** und **React Testing Library** für Unit- und Integration-Tests.

### Installation

Alle Test-Dependencies sind bereits installiert:
- `vitest` - Test Runner
- `@testing-library/react` - React Testing Utilities
- `@testing-library/jest-dom` - Custom Jest Matchers
- `@testing-library/user-event` - User Interaction Simulation
- `@vitest/ui` - UI für Test-Ergebnisse
- `@vitest/coverage-v8` - Code Coverage
- `jsdom` - DOM-Simulation

## Test-Befehle

Füge diese Scripts in `package.json` hinzu:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Befehle:
- `npm test` - Tests im Watch-Mode ausführen
- `npm run test:ui` - Tests mit UI ausführen (http://localhost:51204/__vitest__/)
- `npm run test:run` - Tests einmalig ausführen (für CI/CD)
- `npm run test:coverage` - Coverage-Report generieren

## Test-Struktur

```
src/
├── components/
│   └── __tests__/
│       └── ProfileCard.test.tsx
├── lib/
│   └── __tests__/
│       ├── stringUtils.test.ts
│       └── utils.test.ts
├── hooks/
│   └── __tests__/
│       └── useReports.test.ts
└── test/
    ├── setup.ts              # Test-Konfiguration
    ├── utils/
    │   ├── test-utils.tsx    # Custom Render mit Providern
    │   └── mock-data.ts      # Wiederverwendbare Mock-Daten
    └── integration/
        └── profile-search.test.tsx
```

## Test-Typen

### Unit Tests
Tests für einzelne Funktionen/Komponenten:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeSlug } from '../stringUtils';

describe('normalizeSlug', () => {
  it('converts umlauts correctly', () => {
    expect(normalizeSlug('Zürich')).toBe('zuerich');
  });
});
```

### Component Tests
Tests für React-Komponenten:

```typescript
import { render, screen } from '@/test/utils/test-utils';
import { ProfileCard } from '../ProfileCard';

it('renders profile information', () => {
  render(<ProfileCard profile={mockProfile} />);
  expect(screen.getByText('Test User, 25')).toBeInTheDocument();
});
```

### Integration Tests
Tests für vollständige User Flows:

```typescript
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { Suche } from '@/pages/Suche';

it('displays search results', async () => {
  render(<Suche />);
  await waitFor(() => {
    expect(screen.getByText('Test User, 25')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Custom Render verwenden
Nutze immer `render` aus `@/test/utils/test-utils` statt direkt aus `@testing-library/react`:

```typescript
import { render } from '@/test/utils/test-utils'; // ✅ Korrekt
import { render } from '@testing-library/react'; // ❌ Falsch
```

### 2. Mock-Daten wiederverwenden
Nutze zentrale Mock-Daten aus `src/test/utils/mock-data.ts`:

```typescript
import { mockProfile, mockCategory } from '@/test/utils/mock-data';
```

### 3. User Events simulieren
Nutze `@testing-library/user-event` für Benutzerinteraktionen:

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.type(input, 'test');
await user.click(button);
```

### 4. Async Tests
Nutze `waitFor` für asynchrone Operationen:

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 5. Mocking
Mock externe Dependencies mit `vi.mock`:

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));
```

## Coverage-Ziele

Aktuelle Schwellenwerte (definiert in `vitest.config.ts`):
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

Ausgeschlossen vom Coverage:
- `node_modules/`
- Test-Dateien
- TypeScript-Definition-Dateien
- Config-Dateien
- Mock-Daten
- Supabase-generierte Typen

## Prioritäre Test-Bereiche

### High Priority ✅
- ✅ `ProfileCard` - Profil-Anzeige
- ✅ `stringUtils` - URL-Slug-Normalisierung
- ✅ `utils.ts` - Tailwind-Klassen-Merging
- ✅ `SearchFilters` - Such-Filter
- ✅ `useReports` - Report-Erstellung
- ✅ Integration: Profil-Suche

### Medium Priority (TODO)
- `ProfileForm` - Profil-Erstellung/-Bearbeitung
- `AuthContext` - Authentifizierung
- `useProfiles` - Profil-Abfragen
- `PhotoUploader` - Foto-Upload
- `SearchResults` - Such-Ergebnisse

### Low Priority (Nice-to-have)
- `AdminDashboard` - Admin-Bereich
- `BannerManager` - Werbebanner
- SEO-Komponenten

## Continuous Integration

Für CI/CD-Pipelines:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

## Troubleshooting

### "Cannot find module"
Stelle sicher, dass `@/` Alias in `vitest.config.ts` konfiguriert ist.

### "IntersectionObserver is not defined"
Bereits in `src/test/setup.ts` gemockt.

### "matchMedia is not a constructor"
Bereits in `src/test/setup.ts` gemockt.

### Supabase-Mocking
Nutze das Pattern aus `profile-search.test.tsx` für Supabase-Mocks.

## Weitere Ressourcen

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
