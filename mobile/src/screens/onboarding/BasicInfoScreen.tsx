import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Input, Button, ButtonGroup } from '@rneui/themed';
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
  const [selectedGenderIndex, setSelectedGenderIndex] = useState<number | undefined>(
    data.profile.gender ? ['male', 'female', 'other'].indexOf(data.profile.gender) : undefined
  );
  const [selectedUnitsIndex, setSelectedUnitsIndex] = useState(
    data.profile.units_preference === 'imperial' ? 1 : 0
  ); // 0 = Metric, 1 = Imperial
  
  // Height states - separate for imperial
  const [heightCm, setHeightCm] = useState(data.profile.height?.toString() || '');
  const [heightFeet, setHeightFeet] = useState(() => {
    if (!data.profile.height) return '';
    const totalInches = data.profile.height / 2.54;
    const feet = Math.floor(totalInches / 12);
    return feet > 0 ? feet.toString() : '';
  });
  const [heightInches, setHeightInches] = useState(() => {
    if (!data.profile.height) return '';
    const totalInches = data.profile.height / 2.54;
    const inches = Math.round(totalInches % 12);
    return inches > 0 ? inches.toString() : '';
  });
  
  // Weight state
  const [weight, setWeight] = useState(
    data.profile.weight 
      ? selectedUnitsIndex === 1 
        ? Math.round(data.profile.weight * 2.205).toString()
        : data.profile.weight.toString()
      : ''
  );
  
  
  const genderButtons = ['Male', 'Female', 'Other'];
  const unitButtons = ['Metric', 'Imperial'];
  
  // Handle unit system change
  const handleUnitsChange = (index: number) => {
    if (index === selectedUnitsIndex) return;
    
    // Convert values when switching units
    if (index === 1) { // Switching to Imperial
      // Convert cm to feet and inches
      if (heightCm) {
        const totalInches = parseFloat(heightCm) / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFeet(feet > 0 ? feet.toString() : '');
        setHeightInches(inches > 0 ? inches.toString() : '');
      }
      // Convert kg to lbs
      if (weight) {
        setWeight(Math.round(parseFloat(weight) * 2.205).toString());
      }
    } else { // Switching to Metric
      // Convert feet and inches to cm
      if (heightFeet || heightInches) {
        const feet = parseFloat(heightFeet) || 0;
        const inches = parseFloat(heightInches) || 0;
        const cm = (feet * 30.48) + (inches * 2.54);
        setHeightCm(Math.round(cm).toString());
      }
      // Convert lbs to kg
      if (weight) {
        setWeight(Math.round(parseFloat(weight) * 0.453592).toString());
      }
    }
    
    setSelectedUnitsIndex(index);
  };
  
  // Format birthday input as user types
  const handleBirthdayChange = (text: string) => {
    // If the user is deleting (text is shorter than current), allow it
    if (text.length < birthday.length) {
      setBirthday(text);
      return;
    }
    
    // Remove all non-numeric characters for new input
    const cleaned = text.replace(/\D/g, '');
    
    // Format as MM/DD/YYYY
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }
    
    setBirthday(formatted);
  };
  
  const handleNext = () => {
    // Validate inputs
    if (!name || !birthday || selectedGenderIndex === undefined) {
      Alert.alert('Required Fields', 'Please fill in name, birthday, and gender');
      return;
    }
    
    // Validate birthday format
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
    
    // Convert units if needed (store in metric)
    let heightInCm: number | undefined;
    let weightInKg: number | undefined;
    
    if (selectedUnitsIndex === 0) { // Metric
      heightInCm = heightCm ? parseFloat(heightCm) : undefined;
      weightInKg = weight ? parseFloat(weight) : undefined;
    } else { // Imperial
      // Convert feet and inches to cm
      if (heightFeet || heightInches) {
        const feet = parseFloat(heightFeet) || 0;
        const inches = parseFloat(heightInches) || 0;
        heightInCm = (feet * 30.48) + (inches * 2.54);
      }
      // Convert lbs to kg
      weightInKg = weight ? parseFloat(weight) * 0.453592 : undefined;
    }
    
    // Save to store
    const profileData = {
      name,
      birthday,
      age,
      gender: genderButtons[selectedGenderIndex].toLowerCase(),
      height: heightInCm,
      weight: weightInKg,
      units_preference: selectedUnitsIndex === 0 ? 'metric' : 'imperial' as 'metric' | 'imperial',
    };
    
    updateProfile(profileData);
    setCurrentStep(2);
    
    // Navigate to next screen
    navigation.navigate('LocationPrivacy');
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
            onChangeText={handleBirthdayChange}
            keyboardType="number-pad"
            maxLength={10}
            leftIcon={{ type: 'ionicon', name: 'calendar-outline', color: theme.colors.primary[400] }}
            labelStyle={styles.inputLabel}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
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
          
          <View style={styles.unitsSection}>
            <Text style={styles.inputLabel}>Unit System</Text>
            <ButtonGroup
              buttons={unitButtons}
              selectedIndex={selectedUnitsIndex}
              onPress={handleUnitsChange}
              containerStyle={styles.unitButtonGroup}
              selectedButtonStyle={styles.selectedButton}
              textStyle={styles.buttonText}
              selectedTextStyle={styles.selectedButtonText}
            />
          </View>
          
          <View style={styles.row}>
            {selectedUnitsIndex === 0 ? (
              // Metric - single height input in cm
              <Input
                label="Height"
                placeholder="170"
                placeholderTextColor={theme.colors.placeholder}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                rightIcon={<Text style={styles.unitLabel}>cm</Text>}
                labelStyle={styles.inputLabel}
                inputStyle={styles.input}
                containerStyle={[styles.inputContainer, styles.halfInput]}
              />
            ) : (
              // Imperial - separate feet and inches inputs
              <View style={styles.imperialHeight}>
                <Input
                  label="Height"
                  placeholder="5"
                  placeholderTextColor={theme.colors.placeholder}
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  keyboardType="numeric"
                  rightIcon={<Text style={styles.unitLabel}>ft</Text>}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.input}
                  containerStyle={[styles.inputContainer, styles.quarterInput]}
                />
                <Input
                  label=" "
                  placeholder="10"
                  placeholderTextColor={theme.colors.placeholder}
                  value={heightInches}
                  onChangeText={setHeightInches}
                  keyboardType="numeric"
                  rightIcon={<Text style={styles.unitLabel}>in</Text>}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.input}
                  containerStyle={[styles.inputContainer, styles.quarterInput]}
                />
              </View>
            )}
            
            <Input
              label="Weight"
              placeholder={selectedUnitsIndex === 0 ? "70" : "154"}
              placeholderTextColor={theme.colors.placeholder}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              rightIcon={<Text style={styles.unitLabel}>{selectedUnitsIndex === 0 ? 'kg' : 'lbs'}</Text>}
              labelStyle={styles.inputLabel}
              inputStyle={styles.input}
              containerStyle={[styles.inputContainer, styles.halfInput]}
            />
          </View>
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
  unitsSection: {
    marginBottom: theme.spacing.lg,
  },
  buttonGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  unitButtonGroup: {
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
  imperialHeight: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quarterInput: {
    flex: 1,
  },
  unitLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
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