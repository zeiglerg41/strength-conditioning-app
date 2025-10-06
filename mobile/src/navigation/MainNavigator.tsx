import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { MainTabParamList, RootStackParamList } from '../types';
import DashboardScreen from '../screens/DashboardScreen';
import ProgramsScreen from '../screens/program/ProgramsScreen';
import WorkoutsScreen from '../screens/workout/WorkoutsScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OnboardingModal from '../components/OnboardingModal';
import { theme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const { needsOnboarding } = useAuthStore();
  const { currentStep, isProfileComplete, loadOnboardingProgress, checkProfileCompletion } = useOnboardingStore();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Load onboarding progress when component mounts
    const checkOnboardingStatus = async () => {
      await loadOnboardingProgress();

      // Get fresh state after loading
      const { isProfileComplete: profileComplete } = useOnboardingStore.getState();

      // Only show modal if profile is NOT complete
      // profileComplete is set based on database onboarding_completed_at or profile_completion_percentage === 100
      if (!profileComplete) {
        const step = checkProfileCompletion();
        setIsReturningUser(step > 1); // User has started but not finished
        setTimeout(() => {
          setShowOnboardingModal(true);
        }, 500);
      }
    };

    checkOnboardingStatus();
  }, []);
  
  const handleStartOnboarding = () => {
    setShowOnboardingModal(false);
    // Navigate to onboarding screens
    navigation.navigate('Onboarding');
  };
  
  const handleDismissModal = () => {
    setShowOnboardingModal(false);
  };
  
  return (
    <>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Programs') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Programs" 
        component={ProgramsScreen}
        options={{ tabBarLabel: 'Programs' }}
      />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsScreen}
        options={{ tabBarLabel: 'Workouts' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
    
    <OnboardingModal
      visible={showOnboardingModal}
      onStartOnboarding={handleStartOnboarding}
      onDismiss={handleDismissModal}
      currentStep={currentStep}
      isReturning={isReturningUser}
    />
    </>
  );
}