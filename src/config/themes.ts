export interface ThemeConfig {
  name: string;
  colors: {
    // Main brand colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    
    // Background colors
    background: string;
    backgroundAlt: string;
    surface: string;
    sidebar: string;
    
    // Button colors
    buttonPrimary: string;
    buttonPrimaryHover: string;
    buttonSecondary: string;
    buttonSecondaryHover: string;
    buttonDanger: string;
    buttonDangerHover: string;
    
    // Form colors
    inputBorder: string;
    inputBorderFocus: string;
    inputBackground: string;
    inputBackgroundFocus: string;
    
    // Tab colors
    tabActive: string;
    tabActiveHover: string;
    tabInactive: string;
    tabInactiveHover: string;
    
    // Status colors
    success: string;
    error: string;
    
    // Text colors
    textDark: string;
    textMedium: string;
    textLight: string;
    grayLight: string;
    
    // Modal/overlay colors
    modalOverlay: string;
    modalBackground: string;
    
    // Checkbox/form controls
    checkboxChecked: string;
    checkboxUnchecked: string;
  };
  logo: {
    text: string;
    subText: string;
    imageUrl?: string;
    loginImageUrl?: string; // New: Special logo for login modal
    useImageOnly?: boolean;
  };
  companyName: string;
}

export const themes: Record<string, ThemeConfig> = {
  'dxc': {
  name: 'DXC Technology',
  colors: {
    // Main brand colors from DXC palette
    primary: '#5F249F',
    primaryLight: '#E6D9F2', 
    primaryDark: '#4A1D7A',
    secondary: '#000000',
    
    // Background colors
    background: '#FFFFFF',
    backgroundAlt: '#F8F7FA',
    surface: '#FFFFFF',
    sidebar: '#5F249F',
    
    // Button colors
    buttonPrimary: '#5F249F',
    buttonPrimaryHover: '#4A1D7A',
    buttonSecondary: '#000000',
    buttonSecondaryHover: '#2D3748',
    buttonDanger: '#E53E3E',
    buttonDangerHover: '#C53030',
    
    // Form colors
    inputBorder: '#E2E8F0',
    inputBorderFocus: '#5F249F',
    inputBackground: '#F8F7FA',
    inputBackgroundFocus: '#FFFFFF',
    
    // Tab colors
    tabActive: '#5F249F',
    tabActiveHover: '#4A1D7A',
    tabInactive: '#718096',
    tabInactiveHover: '#2D3748',
    
    // Status colors
    success: '#38A169',
    error: '#E53E3E',
    
    // Text colors from DXC palette
    textDark: '#2D3748',
    textMedium: '#718096',
    textLight: '#A0AEC0',
    grayLight: '#E2E8F0',
    
    // Modal/overlay colors
    modalOverlay: 'rgba(45, 55, 72, 0.6)',
    modalBackground: '#FFFFFF',
    
    // Checkbox/form controls
    checkboxChecked: '#5F249F',
    checkboxUnchecked: '#E2E8F0',
  },
  logo: {
    text: 'DXC',
    subText: 'AI',
    imageUrl: process.env.NEXT_PUBLIC_DXC_LOGO_URL, // Sidebar logo
    loginImageUrl: '/images/dxc-logo-login.svg', // Special login logo
    useImageOnly: true,
  },
  companyName: 'DXC AI Assistant'
},
  'dpac': {
    name: 'DPaC',
    colors: {
      // Main brand colors from DPaC palette
      primary: '#334C66',
      primaryLight: '#A0BBD7',
      primaryDark: '#27394C',
      secondary: '#FCF7E6',
      
      // Background colors
      background: '#FFFFFF',
      backgroundAlt: '#F8F7FA',
      surface: '#FFFFFF',
      sidebar: '#334C66',
      
      // Button colors
      buttonPrimary: '#334C66',
      buttonPrimaryHover: '#27394C',
      buttonSecondary: '#FCF7E6',
      buttonSecondaryHover: '#A0BBD7',
      buttonDanger: '#E53E3E',
      buttonDangerHover: '#C53030',
      
      // Form colors
      inputBorder: '#E2E8F0',
      inputBorderFocus: '#334C66',
      inputBackground: '#F8F7FA',
      inputBackgroundFocus: '#FFFFFF',
      
      // Tab colors
      tabActive: '#334C66',
      tabActiveHover: '#27394C',
      tabInactive: '#718096',
      tabInactiveHover: '#2D3748',
      
      // Status colors
      success: '#38A169',
      error: '#E53E3E',
      
      // Text colors from DPaC palette (same as DXC)
      textDark: '#2D3748',
      textMedium: '#718096',
      textLight: '#A0AEC0',
      grayLight: '#E2E8F0',
      
      // Modal/overlay colors
      modalOverlay: 'rgba(51, 76, 102, 0.6)',
      modalBackground: '#FFFFFF',
      
      // Checkbox/form controls
      checkboxChecked: '#334C66',
      checkboxUnchecked: '#E2E8F0',
    },
    logo: {
      text: 'DPaC',
      subText: 'AI',
      imageUrl: process.env.NEXT_PUBLIC_DPAC_LOGO_URL, // Sidebar logo
      loginImageUrl: '/images/dpac-logo-login.svg', // Special login logo
      useImageOnly: true,
    },
    companyName: 'DPaC AI Assistant'
  }
};

const getCurrentTheme = (): ThemeConfig => {
  const themeName = process.env.NEXT_PUBLIC_THEME || 'dxc';
  return themes[themeName] || themes['dxc'];
};

export const currentTheme = getCurrentTheme();