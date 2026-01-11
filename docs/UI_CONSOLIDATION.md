# UI Component Consolidation

## Overview

Eliminated duplicate UI components between psychic and non-psychic player screens by creating unified, reusable components that serve both contexts with variant support.

## Problems Identified

### 1. **Duplicate Player Score Displays**
- **Psychic View** (ActiveGameScreen): Custom inline "All Players Locked In - Results" display
- **Results Screen**: Separate PlayerScoresTable component
- **Issue**: Same data displayed with different styling - maintenance burden

### 2. **Duplicate Action Buttons**
- Multiple button implementations with similar styling:
  - "Next Round" button (2 implementations)
  - "Set Target" / "Random Target" buttons
  - "Lock In Guess" button
  - "Waiting for Psychic" disabled state
- **Issue**: Inconsistent styling, duplicate gradient/animation code

## Solutions Implemented

### 1. Enhanced PlayerScoresTable Component

**File**: `components/ui/PlayerScoresTable.tsx`

Added variant support to serve both psychic and results screens:

```tsx
interface PlayerScoresTableProps {
  playerGuesses: PlayerGuess[];
  loading?: boolean;
  showTitle?: boolean;
  titleText?: string;
  variant?: 'default' | 'psychic'; // NEW
  showTargetPosition?: boolean;     // NEW
  targetPosition?: number;          // NEW
}
```

**Psychic Variant** (ActiveGameScreen):
- Teal border (`border-teal-500`)
- Teal title text
- Fuchsia-colored distance values
- Shows target position at bottom

**Default Variant** (ResultsScreen):
- Zinc border (`border-zinc-700`)
- White title text
- Colored rank borders (fuchsia, blue, green, purple)
- Yellow points display

**Usage**:
```tsx
// Psychic view
<PlayerScoresTable
  playerGuesses={guesses}
  variant="psychic"
  titleText="All Players Locked In - Results"
  showTargetPosition={true}
  targetPosition={targetPos}
/>

// Results screen
<PlayerScoresTable
  playerGuesses={guesses}
  variant="default"
/>
```

### 2. New ActionButton Component

**File**: `components/ui/ActionButton.tsx`

Unified button component for all primary actions:

```tsx
interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'teal' | 'purple' | 'fuchsia';
  fullWidth?: boolean;
  showPulse?: boolean;
  className?: string;
}
```

**Variants**:
- **teal**: Psychic actions (Set Target, Next Round)
- **purple**: Secondary psychic actions (Random Target)
- **fuchsia**: Player actions (Lock In Guess)
- **primary**: General actions (Results Next Round)

**Features**:
- Automatic disabled state styling
- Pulse animation overlay (can be disabled)
- Gradient backgrounds with hover effects
- Consistent sizing and typography

**Usage Examples**:
```tsx
// Psychic set target
<ActionButton variant="teal" onClick={handleSetTarget} disabled={targetSet}>
  SET TARGET POSITION
</ActionButton>

// Player lock in
<ActionButton variant="fuchsia" onClick={handleLockIn} disabled={isLocked}>
  LOCK IN GUESS
</ActionButton>

// Next round
<ActionButton variant="primary" onClick={handleNextRound} fullWidth={false}>
  NEXT ROUND
</ActionButton>
```

## Code Reduction

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| ActiveGameScreen.tsx | 823 lines | 735 lines | **-88 lines (-11%)** |
| ResultsScreen.tsx | 218 lines | 214 lines | **-4 lines** |
| **Total Screen Files** | **1,041 lines** | **949 lines** | **-92 lines (-9%)** |

New shared components: **159 lines** (ActionButton: 73, Enhanced PlayerScoresTable: 86 additional)

## Benefits

### 1. **Single Source of Truth**
- Player scores displayed identically in both contexts
- Button styling consistent across all screens
- Changes propagate automatically to all usages

### 2. **Improved Maintainability**
- Update button styling once, affects all buttons
- Fix score display bugs in one place
- Easier to add new button variants

### 3. **Better UX Consistency**
- Players see familiar UI patterns across screens
- Psychics and non-psychics have consistent action buttons
- Reduced cognitive load

### 4. **Type Safety**
- Shared interfaces ensure data compatibility
- Variant types prevent invalid configurations
- Props validation catches errors at compile time

## Component Mapping

### PlayerScoresTable Usage

| Screen | Variant | Title | Target Position |
|--------|---------|-------|-----------------|
| ActiveGameScreen (Psychic) | `psychic` | "All Players Locked In - Results" | ✅ Shown |
| ResultsScreen | `default` | "Player Scores" | ❌ Hidden |

### ActionButton Usage

| Screen | Action | Variant | Full Width |
|--------|--------|---------|------------|
| ActiveGameScreen | Set Target | `teal` | ✅ |
| ActiveGameScreen | Random Target | `purple` | ✅ |
| ActiveGameScreen | Lock In Guess | `fuchsia` | ✅ |
| ActiveGameScreen | Waiting | disabled | ✅ |
| ActiveGameScreen (Psychic) | Next Round | `teal` | ✅ |
| ResultsScreen | Next Round | `primary` | ❌ |

## Visual Comparison

### Before (Duplicated Code)

**ActiveGameScreen (Psychic Results)**:
```tsx
<div className="bg-zinc-900 border-2 border-teal-500 p-6">
  <h2 className="text-2xl font-bold text-teal-400 mb-4">
    All Players Locked In - Results
  </h2>
  {/* 35 lines of custom score display */}
</div>
<button className="w-full py-6 px-8 text-3xl ... bg-gradient-to-r ...">
  Next Round →
</button>
```

**ResultsScreen**:
```tsx
<PlayerScoresTable playerGuesses={guesses} loading={false} />
<button className="px-12 py-6 border-2 ... bg-fuchsia-600 ...">
  NEXT ROUND
</button>
```

### After (Unified Components)

**ActiveGameScreen (Psychic Results)**:
```tsx
<PlayerScoresTable
  playerGuesses={guesses}
  variant="psychic"
  titleText="All Players Locked In - Results"
  showTargetPosition={true}
  targetPosition={targetPos}
/>
<ActionButton variant="teal" onClick={handleNextRound}>
  Next Round →
</ActionButton>
```

**ResultsScreen**:
```tsx
<PlayerScoresTable playerGuesses={guesses} loading={false} />
<ActionButton variant="primary" onClick={handleNextRound} fullWidth={false}>
  NEXT ROUND
</ActionButton>
```

## Impact Summary

- ✅ **Eliminated 35+ lines of duplicate score display code**
- ✅ **Consolidated 5 button implementations into 1 component**
- ✅ **Consistent styling across psychic and player views**
- ✅ **Type-safe variant system prevents configuration errors**
- ✅ **92 lines removed from screen files (-9%)**
- ✅ **Zero functionality changes** - pure refactor

## Testing Checklist

- [ ] Psychic can see player scores after all lock in
- [ ] Scores display matches between psychic view and results screen
- [ ] All buttons respond correctly to clicks
- [ ] Disabled states show proper styling
- [ ] Pulse animations work on enabled buttons
- [ ] Button gradients and hover effects work
- [ ] Mobile responsive (buttons stack correctly)
- [ ] Target position shows in psychic view only

## Related

- See [COMPONENT_EXTRACTION.md](./COMPONENT_EXTRACTION.md) for initial component extraction
- See [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md) for centralized actions layer
- See [TYPE_SAFETY_IMPROVEMENTS.md](./TYPE_SAFETY_IMPROVEMENTS.md) for database type safety
