import React, { useEffect } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList, RootStackParamList } from '../types';
import BasicInfoScreen from '../screens/onboarding/BasicInfoScreen';
import LocationPrivacyScreen from '../screens/onboarding/LocationPrivacyScreen';
import TrainingLocationsScreen from '../screens/onboarding/TrainingLocationsScreen';
import TrainingBackgroundScreen from '../screens/onboarding/TrainingBackgroundScreen';
import ScheduleLifestyleScreen from '../screens/onboarding/ScheduleLifestyleScreen';
import ReviewScreen from '../screens/onboarding/ReviewScreen';
import { theme } from '../constants/theme';
import { useOnboardingStore } from '../store/onboardingStore';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  const { currentStep } = useOnboardingStore();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Determine initial route based on current step
  const getInitialRouteName = () => {
    switch (currentStep) {
      case 1: return 'BasicInfo';
      case 2: return 'LocationPrivacy';
      case 3: return 'TrainingLocations';
      case 4: return 'TrainingBackground';
      case 5: return 'ScheduleLifestyle';
      case 6: return 'Review';
      default: return 'BasicInfo';
    }
  };
  
  const handleExitOnboarding = () => {
    Alert.alert(
      'Exit Onboarding?',
      'Your progress has been saved. You can continue later, but most app features will be unavailable until you complete your profile.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => rootNavigation.navigate('Main'),
        },
      ],
    );
  };
  
  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          ...theme.typography.heading.h3,
        },
        headerBackTitleVisible: false,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleExitOnboarding}
            style={{ marginRight: 16 }}
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="BasicInfo" 
        component={BasicInfoScreen}
        options={{ 
          title: 'Profile Setup',
          headerLeft: () => null, // Prevent going back
        }}
      />
      <Stack.Screen 
        name="LocationPrivacy" 
        component={LocationPrivacyScreen}
        options={{ 
          title: 'Location & Privacy',
        }}
      />
      <Stack.Screen 
        name="TrainingLocations" 
        component={TrainingLocationsScreen}
        options={{ 
          title: 'Training Locations',
        }}
      />
      <Stack.Screen 
        name="TrainingBackground" 
        component={TrainingBackgroundScreen}
        options={{ 
          title: 'Training Background',
        }}
      />
      <Stack.Screen 
        name="ScheduleLifestyle" 
        component={ScheduleLifestyleScreen}
        options={{ 
          title: 'Schedule & Lifestyle',
        }}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen}
        options={{ 
          title: 'Review & Submit',
        }}
      />
    </Stack.Navigator>
  );
}