import { theme } from '../theme';

describe('Theme Configuration', () => {
  describe('Colors', () => {
    it('should have complete color palettes', () => {
      const colorKeys = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'neutral'];
      
      colorKeys.forEach(colorKey => {
        const colorPalette = theme.colors[colorKey as keyof typeof theme.colors];
        if (typeof colorPalette === 'object' && colorPalette !== null && !Array.isArray(colorPalette)) {
          expect(colorPalette).toHaveProperty('50');
          expect(colorPalette).toHaveProperty('100');
          expect(colorPalette).toHaveProperty('200');
          expect(colorPalette).toHaveProperty('300');
          expect(colorPalette).toHaveProperty('400');
          expect(colorPalette).toHaveProperty('500');
          expect(colorPalette).toHaveProperty('600');
          expect(colorPalette).toHaveProperty('700');
          expect(colorPalette).toHaveProperty('800');
          expect(colorPalette).toHaveProperty('900');
        }
      });
    });

    it('should have dark theme semantic colors', () => {
      expect(theme.colors.background).toBeDefined();
      expect(theme.colors.surface).toBeDefined();
      expect(theme.colors.surfaceElevated).toBeDefined();
      expect(theme.colors.text).toBeDefined();
      expect(theme.colors.textSecondary).toBeDefined();
      expect(theme.colors.textMuted).toBeDefined();
      expect(theme.colors.border).toBeDefined();
      expect(theme.colors.borderMuted).toBeDefined();
      expect(theme.colors.overlay).toBeDefined();
    });

    it('should have neon glow colors', () => {
      expect(theme.colors.glow.primary).toBeDefined();
      expect(theme.colors.glow.secondary).toBeDefined();
      expect(theme.colors.glow.accent).toBeDefined();
    });

    it('should have valid color format', () => {
      expect(theme.colors.primary[500]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.overlay).toMatch(/^rgba\(/);
      expect(theme.colors.glow.primary).toMatch(/^rgba\(/);
    });

    it('should use Supabase-inspired colors', () => {
      expect(theme.colors.primary[400]).toBe('#3ECF8E'); // Supabase brand green
      expect(theme.colors.primary[500]).toBe('#249361'); // Supabase gradient green
      expect(theme.colors.surface).toBe('#11181c'); // Supabase Bunker color
    });

    it('should have proper dark theme background colors', () => {
      expect(theme.colors.background).toBe('#09090b'); // Deep black
      expect(theme.colors.surface).toBe('#11181c'); // Bunker
      expect(theme.colors.surfaceElevated).toBe('#18181b'); // Elevated
    });
  });

  describe('Typography', () => {
    it('should have complete heading styles', () => {
      const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      
      headingLevels.forEach(level => {
        const headingStyle = theme.typography.heading[level as keyof typeof theme.typography.heading];
        expect(headingStyle).toHaveProperty('fontSize');
        expect(headingStyle).toHaveProperty('fontWeight');
        expect(headingStyle).toHaveProperty('lineHeight');
        expect(headingStyle).toHaveProperty('letterSpacing');
        expect(typeof headingStyle.fontSize).toBe('number');
        expect(typeof headingStyle.fontWeight).toBe('string');
        expect(typeof headingStyle.lineHeight).toBe('number');
      });
    });

    it('should have complete body styles', () => {
      const bodyStyles = ['large', 'medium', 'small', 'xs'];
      
      bodyStyles.forEach(style => {
        const bodyStyle = theme.typography.body[style as keyof typeof theme.typography.body];
        expect(bodyStyle).toHaveProperty('fontSize');
        expect(bodyStyle).toHaveProperty('fontWeight');
        expect(bodyStyle).toHaveProperty('lineHeight');
        expect(typeof bodyStyle.fontSize).toBe('number');
        expect(typeof bodyStyle.fontWeight).toBe('string');
        expect(typeof bodyStyle.lineHeight).toBe('number');
      });
    });

    it('should have caption style', () => {
      expect(theme.typography.caption).toHaveProperty('fontSize');
      expect(theme.typography.caption).toHaveProperty('fontWeight');
      expect(theme.typography.caption).toHaveProperty('lineHeight');
      expect(theme.typography.caption).toHaveProperty('textTransform');
      expect(theme.typography.caption).toHaveProperty('letterSpacing');
    });

    it('should have font sizes in correct order', () => {
      // Headings should decrease in size from h1 to h6
      expect(theme.typography.heading.h1.fontSize).toBeGreaterThan(theme.typography.heading.h2.fontSize);
      expect(theme.typography.heading.h2.fontSize).toBeGreaterThan(theme.typography.heading.h3.fontSize);
      expect(theme.typography.heading.h3.fontSize).toBeGreaterThan(theme.typography.heading.h4.fontSize);
      expect(theme.typography.heading.h4.fontSize).toBeGreaterThan(theme.typography.heading.h5.fontSize);
      expect(theme.typography.heading.h5.fontSize).toBeGreaterThan(theme.typography.heading.h6.fontSize);
      
      // Body styles should decrease in size
      expect(theme.typography.body.large.fontSize).toBeGreaterThan(theme.typography.body.medium.fontSize);
      expect(theme.typography.body.medium.fontSize).toBeGreaterThan(theme.typography.body.small.fontSize);
      expect(theme.typography.body.small.fontSize).toBeGreaterThan(theme.typography.body.xs.fontSize);
    });
  });

  describe('Spacing', () => {
    it('should have consistent spacing scale', () => {
      const spacingKeys = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];
      
      spacingKeys.forEach(key => {
        expect(theme.spacing[key as keyof typeof theme.spacing]).toBeDefined();
        expect(typeof theme.spacing[key as keyof typeof theme.spacing]).toBe('number');
      });
    });

    it('should have increasing spacing values', () => {
      expect(theme.spacing.xs).toBeLessThan(theme.spacing.sm);
      expect(theme.spacing.sm).toBeLessThan(theme.spacing.md);
      expect(theme.spacing.md).toBeLessThan(theme.spacing.lg);
      expect(theme.spacing.lg).toBeLessThan(theme.spacing.xl);
      expect(theme.spacing.xl).toBeLessThan(theme.spacing.xxl);
      expect(theme.spacing.xxl).toBeLessThan(theme.spacing.xxxl);
    });
  });

  describe('Border Radius', () => {
    it('should have complete border radius scale', () => {
      const radiusKeys = ['xs', 'sm', 'md', 'lg', 'xl', 'full'];
      
      radiusKeys.forEach(key => {
        expect(theme.borderRadius[key as keyof typeof theme.borderRadius]).toBeDefined();
        expect(typeof theme.borderRadius[key as keyof typeof theme.borderRadius]).toBe('number');
      });
    });

    it('should have increasing radius values (except full)', () => {
      expect(theme.borderRadius.xs).toBeLessThan(theme.borderRadius.sm);
      expect(theme.borderRadius.sm).toBeLessThan(theme.borderRadius.md);
      expect(theme.borderRadius.md).toBeLessThan(theme.borderRadius.lg);
      expect(theme.borderRadius.lg).toBeLessThan(theme.borderRadius.xl);
      expect(theme.borderRadius.full).toBe(9999); // Special case for pill shape
    });
  });

  describe('Shadows', () => {
    it('should have complete shadow scale', () => {
      const shadowKeys = ['xs', 'sm', 'md', 'lg', 'xl'];
      
      shadowKeys.forEach(key => {
        const shadow = theme.shadows[key as keyof typeof theme.shadows];
        expect(shadow).toHaveProperty('shadowColor');
        expect(shadow).toHaveProperty('shadowOffset');
        expect(shadow).toHaveProperty('shadowOpacity');
        expect(shadow).toHaveProperty('shadowRadius');
        expect(shadow).toHaveProperty('elevation');
        
        expect(shadow.shadowOffset).toHaveProperty('width');
        expect(shadow.shadowOffset).toHaveProperty('height');
        expect(typeof shadow.shadowOpacity).toBe('number');
        expect(typeof shadow.shadowRadius).toBe('number');
        expect(typeof shadow.elevation).toBe('number');
      });
    });

    it('should have neon glow shadows', () => {
      const neonKeys = ['primary', 'secondary', 'accent'];
      
      neonKeys.forEach(key => {
        const shadow = theme.shadows.neon[key as keyof typeof theme.shadows.neon];
        expect(shadow).toHaveProperty('shadowColor');
        expect(shadow).toHaveProperty('shadowOffset');
        expect(shadow).toHaveProperty('shadowOpacity');
        expect(shadow).toHaveProperty('shadowRadius');
        expect(shadow).toHaveProperty('elevation');
        
        expect(shadow.shadowOffset.width).toBe(0);
        expect(shadow.shadowOffset.height).toBe(0);
        expect(shadow.shadowOpacity).toBe(0.6);
        expect(shadow.shadowRadius).toBe(8);
        expect(shadow.elevation).toBe(6);
      });
    });

    it('should have increasing shadow intensity', () => {
      expect(theme.shadows.xs.elevation).toBeLessThan(theme.shadows.sm.elevation);
      expect(theme.shadows.sm.elevation).toBeLessThan(theme.shadows.md.elevation);
      expect(theme.shadows.md.elevation).toBeLessThan(theme.shadows.lg.elevation);
      expect(theme.shadows.lg.elevation).toBeLessThan(theme.shadows.xl.elevation);
    });

    it('should have enhanced shadow opacity for dark theme', () => {
      expect(theme.shadows.xs.shadowOpacity).toBe(0.3);
      expect(theme.shadows.xl.shadowOpacity).toBe(0.7);
    });
  });
});