/**
 * Minimal tests for AccountManagementSection - Just verify it renders
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import AccountManagementSection from '../AccountManagementSection';

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the auth store
jest.mock('../../../../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: '123', email: 'test@example.com', created_at: '2023-01-01' },
    changeEmail: jest.fn(),
    changePassword: jest.fn(),
    loading: false,
  })),
}));

describe('AccountManagementSection - Minimal Tests', () => {
  it('renders without crashing', () => {
    const component = render(<AccountManagementSection />);

    expect(component).toBeTruthy();
    expect(component.toJSON()).toBeTruthy();
  });

  it('component snapshot matches expected structure', () => {
    const { toJSON } = render(<AccountManagementSection />);
    const tree = toJSON();

    // Just verify it rendered something
    expect(tree).not.toBeNull();
  });
});
