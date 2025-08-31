// Note: @testing-library/jest-native is deprecated, using built-in matchers

// Mock react-native-gesture-handler
// import 'react-native-gesture-handler/jestSetup';

// Mock Expo runtime before any other imports
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: {},
  writable: true,
  configurable: true,
});

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Expo itself
jest.mock('expo', () => ({}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Silence console warnings during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});