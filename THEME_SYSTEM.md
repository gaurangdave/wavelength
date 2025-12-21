# Wavelength Game - Theme System Documentation

## Overview

The Wavelength game now uses a centralized theme system for consistent styling and easier maintenance. All colors, spacing, and design tokens are defined in one place and can be easily modified.

## Architecture

The theme system consists of three main parts:

### 1. **CSS Custom Properties** (`app/globals.css`)
Core design tokens defined as CSS variables for maximum flexibility and performance.

### 2. **TypeScript Theme Configuration** (`lib/theme.ts`)
JavaScript/TypeScript constants and utility functions for programmatic access to theme values.

### 3. **React UI Components** (`components/ui/GameComponents.tsx`)
Reusable React components that consume the theme system.

---

## Color Palette

### Primary Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Psychic** | `#ec4899` (fuchsia-500) | Psychic role, primary accent |
| **Player** | `#14b8a6` (teal-500) | Player/team color, secondary accent |
| **Accent** | `#eab308` (yellow-500) | Points, scoring highlights |
| **Danger** | `#ef4444` (red-500) | Errors, lives lost |
| **Success** | `#10b981` (green-500) | Success states |
| **Info** | `#3b82f6` (blue-500) | Information |
| **Purple** | `#a855f7` (purple-500) | Alternative accent |

### Background Shades

| Level | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Primary** | `#09090b` | zinc-950 | Main background |
| **Secondary** | `#18181b` | zinc-900 | Cards, panels |
| **Tertiary** | `#27272a` | zinc-800 | Inputs, hover states |
| **Hover** | `#3f3f46` | zinc-700 | Interactive hover |

### Dial Scoring Colors

| Zone | Color | Hex | Points |
|------|-------|-----|--------|
| **Empty** | Gray | `#3f3f46` | 0 |
| **Close** | Cyan | `#06b6d4` | 1 |
| **Good** | Yellow | `#eab308` | 2 |
| **Great** | Orange | `#f97316` | 3 |
| **Perfect** | Red | `#ef4444` | 4 |

---

## Using the Theme System

### Method 1: CSS Custom Properties

Use CSS variables directly in component styles:

```tsx
<div style={{ 
  backgroundColor: 'var(--bg-secondary)',
  borderColor: 'var(--color-psychic)',
  color: 'var(--text-primary)'
}}>
  Content
</div>
```

### Method 2: TypeScript Theme Object

Import and use the theme object:

```tsx
import { theme } from '@/lib/theme';

<div style={{
  backgroundColor: theme.backgrounds.secondary,
  borderColor: theme.colors.psychic.primary,
  color: theme.text.primary
}}>
  Content
</div>
```

### Method 3: Theme Class Utilities

Use predefined class combinations:

```tsx
import { themeClasses } from '@/lib/theme';

<div className={themeClasses.card.base + ' ' + themeClasses.card.psychic}>
  Card Content
</div>
```

### Method 4: Reusable React Components (Recommended)

Use pre-built components for consistency:

```tsx
import { GameCard, Title, Button } from '@/components/ui/GameComponents';

<GameCard variant="psychic">
  <Title subtitle="Player Name">Welcome</Title>
  <Button variant="primary" onClick={handleClick}>
    Start Game
  </Button>
</GameCard>
```

---

## Available React Components

### Layout Components

#### `<ScreenContainer>`
Full-screen container with theme background.

```tsx
<ScreenContainer>
  {/* Screen content */}
</ScreenContainer>
```

#### `<GeometricBackground>`
Geometric pattern overlay for visual interest.

```tsx
<GeometricBackground />
```

#### `<CornerAccents>`
Corner decoration accents.

```tsx
<CornerAccents variant="psychic" />
<CornerAccents variant="player" />
<CornerAccents variant="mixed" />
```

### UI Components

#### `<GameCard>`
Themed card container.

```tsx
<GameCard variant="psychic" hoverable onClick={handleClick}>
  Card content
</GameCard>
```

**Props:**
- `variant`: `'psychic' | 'player' | 'neutral'`
- `hoverable`: `boolean` - Enable hover animation
- `onClick`: `() => void` - Click handler

#### `<GameHeader>`
Game status header with room info, score, and lives.

```tsx
<GameHeader 
  roomName="Room Alpha"
  round={2}
  maxRounds={5}
  score={10}
  lives={3}
  maxLives={3}
/>
```

#### `<Button>`
Themed button component.

```tsx
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary'`
- `disabled`: `boolean`
- `type`: `'button' | 'submit'`

#### `<Input>`
Themed text input with focus states.

```tsx
<Input
  value={text}
  onChange={setText}
  label="Enter Name"
  placeholder="Player 456"
  maxLength={20}
/>
```

#### `<ConceptPair>`
Display for binary concept pairs.

```tsx
<ConceptPair 
  leftConcept="Hot" 
  rightConcept="Cold" 
/>
```

#### `<PsychicHint>`
Display psychic's hint with glitch effect.

```tsx
<PsychicHint 
  hint="Lukewarm water"
  glitchEffect={true}
/>
```

#### `<StatusIndicator>`
Loading/waiting status display.

```tsx
<StatusIndicator type="waiting" text="Waiting for players..." />
<StatusIndicator type="loading" text="Connecting..." />
```

#### `<Title>`
Themed title component with optional subtitle.

```tsx
<Title subtitle="Welcome back">
  Choose Your Path
</Title>
```

#### `<ErrorMessage>`
Error message display.

```tsx
<ErrorMessage message="Connection failed" />
```

---

## Utility Functions

### `createDialGradient(targetPosition: number)`
Generate conic gradient for dial scoring visualization.

```tsx
import { createDialGradient } from '@/lib/theme';

<div style={{ background: createDialGradient(50) }} />
```

### `calculatePoints(distance: number)`
Calculate points based on distance from target.

```tsx
import { calculatePoints } from '@/lib/theme';

const points = calculatePoints(15); // Returns 2
```

### `getRankBorderColor(index: number)`
Get border color class for player rankings.

```tsx
import { getRankBorderColor } from '@/lib/theme';

const borderClass = getRankBorderColor(0); // 'border-fuchsia-500'
```

### `getPlayerColor(index: number)`
Get RGB color string for player indicators.

```tsx
import { getPlayerColor } from '@/lib/theme';

const color = getPlayerColor(0); // 'rgb(236, 72, 153)'
```

---

## Migration Guide

### Before (Old Approach)
```tsx
<div className="min-h-screen bg-zinc-950 relative overflow-hidden">
  <div className="bg-zinc-900 border-2 border-fuchsia-600 p-8">
    <h1 className="text-3xl font-bold text-white tracking-widest uppercase">
      Title
    </h1>
    <button className="w-full py-4 px-6 bg-gradient-to-r from-fuchsia-600 to-fuchsia-700">
      Click Me
    </button>
  </div>
</div>
```

### After (New Approach)
```tsx
import { ScreenContainer, GameCard, Title, Button } from '@/components/ui/GameComponents';

<ScreenContainer>
  <GameCard variant="psychic">
    <Title>Title</Title>
    <Button variant="primary">Click Me</Button>
  </GameCard>
</ScreenContainer>
```

---

## Customization

### Changing Theme Colors

Edit `/app/globals.css`:

```css
:root {
  --color-psychic: #your-color;
  --color-player: #your-color;
  /* ... */
}
```

### Changing TypeScript Constants

Edit `/lib/theme.ts`:

```typescript
export const theme = {
  colors: {
    psychic: {
      primary: '#your-color',
      /* ... */
    },
  },
};
```

### Adding New Components

Add to `/components/ui/GameComponents.tsx`:

```tsx
export function YourComponent({ props }: Props) {
  return (
    <div className={themeClasses.yourStyle}>
      {/* Your component */}
    </div>
  );
}
```

---

## Best Practices

1. **Use React Components First**: Prefer pre-built components for consistency
2. **Use Theme Constants**: Avoid hardcoding colors - use theme values
3. **Maintain Single Source of Truth**: Update colors in `globals.css` only
4. **Follow Naming Conventions**: Use semantic names (psychic, player) not color names
5. **Test Accessibility**: Ensure color contrast ratios meet WCAG standards

---

## Benefits

✅ **Centralized Management**: All design tokens in one place  
✅ **Consistency**: Same colors and spacing across all screens  
✅ **Easy Maintenance**: Change theme colors globally with one edit  
✅ **Type Safety**: TypeScript constants provide autocomplete and type checking  
✅ **Reusability**: Components reduce code duplication  
✅ **Performance**: CSS custom properties are performant  
✅ **Scalability**: Easy to add new themes or variants  

---

## File Structure

```
wavelength/
├── app/
│   └── globals.css              # CSS custom properties & utility classes
├── lib/
│   └── theme.ts                 # TypeScript theme config & utilities
└── components/
    └── ui/
        └── GameComponents.tsx   # Reusable themed components
```

---

## Future Enhancements

- [ ] Light mode support
- [ ] Additional color themes (alternate color schemes)
- [ ] Theme switcher UI
- [ ] Animation presets
- [ ] Responsive breakpoint constants
- [ ] More reusable components (modals, tooltips, etc.)

---

## Support

For questions or issues with the theme system, check:
- `lib/theme.ts` for available colors and utilities
- `components/ui/GameComponents.tsx` for component usage examples
- `app/globals.css` for CSS variable definitions
