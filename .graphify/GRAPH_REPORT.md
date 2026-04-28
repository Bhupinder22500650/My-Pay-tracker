# Graph Report - /Users/bhupinderrakhra/Downloads/Projects/My-Pay-tracker/MyPayTracker-main  (2026-04-22)

## Corpus Check
- cluster-only mode - file stats not available

## Summary
- 57 nodes · 67 edges · 9 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `calculateTax()` - 3 edges
2. `updateProfile()` - 2 edges
3. `resetProfile()` - 2 edges
4. `calcAnnualPAYE()` - 2 edges
5. `calcACCForPeriod()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.28
Nodes (3): calcACCForPeriod(), calcAnnualPAYE(), calculateTax()

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (2): resetProfile(), updateProfile()

### Community 6 - "Community 6"
Cohesion: 1
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 6`** (2 nodes): `use-color-scheme.web.ts`, `useColorScheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (1 nodes): `expo-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._