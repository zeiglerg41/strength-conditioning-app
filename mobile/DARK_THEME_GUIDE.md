# Dark Theme Guide - Supabase Inspired

## 🎨 Color Palette

### Primary Colors (Neon Green - Supabase Inspired)
- **Brand Green**: `#3ECF8E` - Main Supabase brand color
- **Gradient Green**: `#249361` - Supabase gradient color
- **Usage**: Primary buttons, links, success states, call-to-action elements

### Secondary Colors (Neon Purple)
- **Main Purple**: `#a855f7` - Vibrant neon purple accent
- **Usage**: Secondary buttons, highlights, special features

### Accent Colors (Neon Blue)
- **Main Blue**: `#3b82f6` - Clean neon blue
- **Usage**: Information states, tertiary actions, data visualization

### Dark Background Colors
- **Background**: `#09090b` - Deep black background
- **Surface**: `#11181c` - Supabase Bunker color for cards/surfaces
- **Surface Elevated**: `#18181b` - Slightly elevated surfaces (modals, dropdowns)

### Text Colors
- **Text**: `#fafafa` - Primary white text
- **Text Secondary**: `#a1a1aa` - Muted text for descriptions
- **Text Muted**: `#71717a` - Very muted text for captions

### Border Colors
- **Border**: `#27272a` - Standard borders
- **Border Muted**: `#18181b` - Subtle borders

## ✨ Neon Glow Effects

### Glow Colors (30% opacity)
```typescript
glow: {
  primary: 'rgba(62, 207, 142, 0.3)',   // Green glow
  secondary: 'rgba(168, 85, 247, 0.3)',  // Purple glow
  accent: 'rgba(59, 130, 246, 0.3)',     // Blue glow
}
```

### Neon Shadow Styles
```typescript
shadows: {
  neon: {
    primary: {
      shadowColor: '#3ECF8E',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 6,
    },
    // ... secondary and accent variants
  }
}
```

## 🎯 Usage Examples

### NeonButton Component
```tsx
import { NeonButton } from '../components/ui/NeonButton';

<NeonButton 
  title="Get Started" 
  variant="primary" 
  onPress={handlePress}
/>
<NeonButton 
  title="Learn More" 
  variant="secondary" 
  onPress={handlePress}
/>
<NeonButton 
  title="Info" 
  variant="accent" 
  onPress={handlePress}
/>
```

### Using Theme in Styles
```tsx
import { theme } from '../constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.md, // Standard shadow
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[400],
    ...theme.shadows.neon.primary, // Neon glow!
  },
  title: {
    ...theme.typography.heading.h2,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
  },
});
```

## 🔧 Enhanced Features

### Enhanced Shadow Opacity
- All standard shadows have increased opacity (0.3 to 0.7) for better visibility on dark backgrounds

### Typography Integration
- All text styles properly integrate with dark theme colors
- Consistent color hierarchy for text elements

### Surface Elevation
- Three levels of surface elevation for proper visual hierarchy
- Subtle color differences that work well in dark environments

## 🎨 Design Principles

1. **High Contrast**: Ensure text is highly readable on dark backgrounds
2. **Neon Accents**: Use sparingly for maximum impact on important elements
3. **Layered Surfaces**: Use elevation to create depth and hierarchy
4. **Consistent Spacing**: Leverage theme spacing for consistent layouts
5. **Accessible Colors**: All color combinations meet accessibility standards

## 🚀 Implementation Status

✅ **Complete Dark Theme Color Palette**  
✅ **Neon Glow Shadow Effects**  
✅ **Updated WelcomeScreen with Dark Theme**  
✅ **Updated LoginScreen with Dark Theme**  
✅ **Custom NeonButton Component**  
✅ **Comprehensive Theme Tests (18 tests)**  
🔄 **Remaining screens to be updated**  

The theme automatically persists across all future components and screens built with this design system.