import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Input, Button, ButtonGroup } from '@rneui/themed';
import DatePicker from 'react-native-date-picker';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';

type Props = StackScreenProps<OnboardingStackParamList, 'BasicInfo'>;

export default function BasicInfoScreen({ navigation }: Props) {
  const { data, updateProfile, setCurrentStep } = useOnboardingStore();
  
  // Initialize with existing data if returning to this screen
  const [name, setName] = useState(data.profile.name || '');
  const [birthday, setBirthday] = useState(data.profile.birthday || '');
  const [birthDate, setBirthDate] = useState<Date>(
    data.profile.birthday 
      ? new Date(data.profile.birthday.split('/').reverse().join('-'))
      : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGenderIndex, setSelectedGenderIndex] = useState<number | undefined>(
    data.profile.gender ? ['male', 'female', 'other'].indexOf(data.profile.gender) : undefined
  );
  const [selectedUnitsIndex, setSelectedUnitsIndex] = useState(0); // 0 = Metric, 1 = Imperial
  const [height, setHeight] = useState(data.profile.height?.toString() || '');
  const [weight, setWeight] = useState(data.profile.weight?.toString() || '');
  const [location, setLocation] = useState(data.profile.location || '');
  
  const genderButtons = ['Male', 'Female', 'Other'];
  const unitButtons = ['Metric', 'Imperial'];
  
  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  const handleNext = () => {
    // Validate inputs
    if (!name || !birthday || selectedGenderIndex === undefined) {
      Alert.alert('Required Fields', 'Please fill in name, birthday, and gender');
      return;
    }
    
    // Validate birthday format (MM/DD/YYYY)
    const birthdayRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!birthdayRegex.test(birthday)) {
      Alert.alert('Invalid Date', 'Please enter birthday in MM/DD/YYYY format');
      return;
    }
    
    // Calculate age from birthday
    const [month, day, year] = birthday.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Save to store
    const profileData = {
      name,
      birthday,
      age,
      gender: genderButtons[selectedGenderIndex].toLowerCase(),
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      location: location || undefined,
    };
    
    updateProfile(profileData);
    setCurrentStep(2);
    
    // Navigate to next screen
    navigation.navigate('Lifestyle');
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Let's Get Started</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Your Name"
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.placeholder}
            value={name}
            onChangeText={setName}
            leftIcon={{ type: 'ionicon', name: 'person-outline', color: theme.colors.primary[400] }}
            labelStyle={styles.inputLabel}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
          />
          
          <Input
            label="Birthday"
            placeholder="MM/DD/YYYY"
            placeholderTextColor={theme.colors.placeholder}
            value={birthday}
            onChangeText={setBirthday}
            keyboardType="numbers-and-punctuation"
            leftIcon={{ type: 'ionicon', name: 'calendar-outline', color: theme.colors.primary[400] }}
            labelStyle={styles.inputLabel}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            maxLength={10}
          />
          
          <View style={styles.genderSection}>
            <Text style={styles.inputLabel}>Gender</Text>
            <ButtonGroup
              buttons={genderButtons}
              selectedIndex={selectedGenderIndex}
              onPress={setSelectedGenderIndex}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
              textStyle={styles.buttonText}
              selectedTextStyle={styles.selectedButtonText}
            />
          </View>
          
          <View style={styles.row}>
            <Input
              label="Height (cm)"
              placeholder="170"
              placeholderTextColor={theme.colors.placeholder}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              labelStyle={styles.inputLabel}
              inputStyle={styles.input}
              containerStyle={[styles.inputContainer, styles.halfInput]}
            />
            
            <Input
              label="Weight (kg)"
              placeholder="70"
              placeholderTextColor={theme.colors.placeholder}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              labelStyle={styles.inputLabel}
              inputStyle={styles.input}
              containerStyle={[styles.inputContainer, styles.halfInput]}
            />
          </View>
          
          <Input
            label="Location (Optional)"
            placeholder="City, Country"
            placeholderTextColor={theme.colors.placeholder}
            value={location}
            onChangeText={setLocation}
            leftIcon={{ type: 'ionicon', name: 'location-outline', color: theme.colors.primary[400] }}
            labelStyle={styles.inputLabel}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.progress}>Step 1 of 6</Text>
          <Button
            title="Continue"
            onPress={handleNext}
            disabled={!name || !birthday || selectedGenderIndex === undefined}
            buttonStyle={[
              styles.continueButton,
              (!name || !birthday || selectedGenderIndex === undefined) && styles.disabledButton
            ]}
            titleStyle={styles.continueButtonText}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body.large,
    color: theme.colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
  },
  genderSection: {
    marginBottom: theme.spacing.lg,
  },
  buttonGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  selectedButton: {
    backgroundColor: theme.colors.primary[400],
  },
  buttonText: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
  },
  selectedButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.xl,
  },
  progress: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  continueButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral[600],
    opacity: 0.5,
  },
  continueButtonText: {
    ...theme.typography.button.large,
    fontWeight: '600',
  },
});