import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../types';
import BasicInfoScreen from '../screens/onboarding/BasicInfoScreen';
import LifestyleScreen from '../screens/onboarding/LifestyleScreen';
import { theme } from '../constants/theme';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
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
        name="Lifestyle" 
        component={LifestyleScreen}
        options={{ 
          title: 'Lifestyle',
        }}
      />
      {/* Will add other screens here:
      <Stack.Screen name="TrainingBackground" component={TrainingBackgroundScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Equipment" component={EquipmentScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      */}
    </Stack.Navigator>
  );
}