import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, BackHandler } from 'react-native';
import { Button, Input, CheckBox, ButtonGroup } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useEditMode } from './editModeHelper';

type Props = StackScreenProps<OnboardingStackParamList, 'TrainingBackground'>;

// Interface for injury details
interface InjuryDetail {
  status: 'active' | 'recovering' | 'past' | '';
  timeframe: string;
  severity: 'mild' | 'moderate' | 'severe' | '';
  description: string;
  limitations: string;
}

// IMPORTANT: Components defined outside parent to prevent keyboard dismissal
// This is a React Native best practice to avoid re-creating components on each render

const RadioOption = ({
  label,
  description,
  selected,
  onPress
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.radioOption, selected && styles.radioOptionSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.radioContent}>
      <View style={styles.radioCircle}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.radioText}>
        <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
          {label}
        </Text>
        <Text style={styles.radioDescription}>{description}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// InjuryDetailForm moved outside to prevent TextInput focus loss
// When this was inside the parent component, it was recreated on every state change
const InjuryDetailForm = ({
  bodyPart,
  detail,
  onUpdate
}: {
  bodyPart: string;
  detail: InjuryDetail;
  onUpdate: (field: keyof InjuryDetail, value: string) => void;
}) => (
  <View style={styles.injuryDetailForm} key={`injury-form-${bodyPart}`}>
    <Text style={styles.injuryFormTitle}>
      {bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)} Injury Details
    </Text>

    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Current Status *</Text>
      <ButtonGroup
        buttons={['Active', 'Recovering', 'Past']}
        selectedIndex={['active', 'recovering', 'past'].indexOf(detail.status)}
        onPress={(index) => onUpdate('status', ['active', 'recovering', 'past'][index])}
        containerStyle={styles.miniButtonGroup}
        selectedButtonStyle={styles.selectedButton}
        textStyle={styles.miniButtonText}
        selectedTextStyle={styles.selectedButtonText}
      />
    </View>

    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>When did this occur?</Text>
      <TextInput
        placeholder="e.g., 2 weeks ago, 3 months ago, last year"
        placeholderTextColor={theme.colors.placeholder}
        value={detail.timeframe}
        onChangeText={(text) => onUpdate('timeframe', text)}
        style={[styles.textInput, styles.smallInput]}
        autoCorrect={false}
        blurOnSubmit={false}
        multiline
        numberOfLines={1}
      />
    </View>

    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Severity</Text>
      <ButtonGroup
        buttons={['Mild', 'Moderate', 'Severe']}
        selectedIndex={['mild', 'moderate', 'severe'].indexOf(detail.severity)}
        onPress={(index) => onUpdate('severity', ['mild', 'moderate', 'severe'][index])}
        containerStyle={styles.miniButtonGroup}
        selectedButtonStyle={styles.selectedButton}
        textStyle={styles.miniButtonText}
        selectedTextStyle={styles.selectedButtonText}
      />
    </View>

    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Brief Description</Text>
      <TextInput
        placeholder="e.g., Rotator cuff strain, Lower back disc issue"
        placeholderTextColor={theme.colors.placeholder}
        value={detail.description}
        onChangeText={(text) => onUpdate('description', text)}
        style={[styles.textInput, styles.smallInput, styles.multilineInput]}
        autoCorrect={false}
        blurOnSubmit={false}
        multiline
        numberOfLines={2}
      />
    </View>

    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Movement Limitations</Text>
      <TextInput
        placeholder="e.g., No overhead pressing, Avoid heavy squats"
        placeholderTextColor={theme.colors.placeholder}
        value={detail.limitations}
        onChangeText={(text) => onUpdate('limitations', text)}
        style={[styles.textInput, styles.smallInput, styles.multilineInput]}
        autoCorrect={false}
        blurOnSubmit={false}
        multiline
        numberOfLines={2}
      />
    </View>
  </View>
);

export default function TrainingBackgroundScreen({ navigation, route }: Props) {
  const { data, updateTrainingBackground, setCurrentStep } = useOnboardingStore();
  const isEditMode = route?.params?.editMode || false;
  const expandedSection = route?.params?.expandedSection;
  const returnTo = route?.params?.returnTo;
  const { handleClose } = useEditMode(isEditMode, navigation, expandedSection, returnTo);
  
  // Training experience classifications for both cardio and strength
  const cardioExperienceOptions = [
    { label: 'None', description: 'No cardio training experience', value: 0 },
    { label: 'Beginner', description: '0-6 months', value: 3 },
    { label: 'Novice', description: '6-12 months', value: 9 },
    { label: 'Intermediate', description: '1-3 years', value: 24 },
    { label: 'Advanced', description: '3+ years', value: 48 },
  ];
  
  const strengthExperienceOptions = [
    { label: 'None', description: 'No strength training experience', value: 0 },
    { label: 'Beginner', description: '0-6 months', value: 3 },
    { label: 'Novice', description: '6-12 months', value: 9 },
    { label: 'Intermediate', description: '1-3 years', value: 24 },
    { label: 'Advanced', description: '3+ years', value: 48 },
  ];
  
  // Initialize with saved data or defaults
  const [selectedCardioExp, setSelectedCardioExp] = useState(() => {
    const index = cardioExperienceOptions.findIndex(
      opt => opt.value === (data.training_background.cardio_training_months || 0)
    );
    return index >= 0 ? index : 0;
  });
  
  const [selectedStrengthExp, setSelectedStrengthExp] = useState(() => {
    const index = strengthExperienceOptions.findIndex(
      opt => opt.value === data.training_background.strength_training_months
    );
    return index >= 0 ? index : 0;
  });
  
  const [injuries, setInjuries] = useState({
    shoulder: false,
    back: false,
    knee: false,
    ankle: false,
    wrist: false,
    hip: false,
    elbow: false,
    neck: false,
    none: !data.training_background.injury_history || data.training_background.injury_history.length === 0,
  });
  
  // Store structured injury details for each selected injury
  interface InjuryDetail {
    status: 'active' | 'recovering' | 'past' | '';
    timeframe: string;
    severity: 'mild' | 'moderate' | 'severe' | '';
    description: string;
    limitations: string;
  }
  
  const [injuryDetails, setInjuryDetails] = useState<Record<string, InjuryDetail>>({
    shoulder: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    back: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    knee: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    ankle: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    wrist: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    hip: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    elbow: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    neck: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
    other: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
  });
  
  const [hasOtherInjury, setHasOtherInjury] = useState(false);
  
  const handleInjuryToggle = (injury: keyof typeof injuries) => {
    if (injury === 'none') {
      // Clear all injuries and details if "none" is selected
      setInjuries({
        shoulder: false,
        back: false,
        knee: false,
        ankle: false,
        wrist: false,
        hip: false,
        elbow: false,
        neck: false,
        none: true,
      });
      // Reset all injury details
      const resetDetails: Record<string, InjuryDetail> = {};
      Object.keys(injuryDetails).forEach(key => {
        resetDetails[key] = { status: '', timeframe: '', severity: '', description: '', limitations: '' };
      });
      setInjuryDetails(resetDetails);
      setHasOtherInjury(false);
    } else {
      // Uncheck "none" if any injury is selected
      const newInjuries = {
        ...injuries,
        [injury]: !injuries[injury],
        none: false,
      };
      setInjuries(newInjuries);
      
      // Clear detail if injury is unchecked
      if (!newInjuries[injury]) {
        setInjuryDetails({
          ...injuryDetails,
          [injury]: { status: '', timeframe: '', severity: '', description: '', limitations: '' },
        });
      }
    }
  };
  
  const handleNext = () => {
    // Collect injury data with structured details
    const injuryList = [];
    if (!injuries.none) {
      Object.keys(injuries).forEach(key => {
        if (key !== 'none' && injuries[key as keyof typeof injuries]) {
          const detail = injuryDetails[key];
          if (detail && detail.status) {
            const injuryInfo = [
              `${key.charAt(0).toUpperCase() + key.slice(1)}`,
              `Status: ${detail.status}`,
              detail.timeframe ? `Timeframe: ${detail.timeframe}` : '',
              detail.severity ? `Severity: ${detail.severity}` : '',
              detail.description ? `Description: ${detail.description}` : '',
              detail.limitations ? `Limitations: ${detail.limitations}` : '',
            ].filter(Boolean).join(' | ');
            injuryList.push(injuryInfo);
          }
        }
      });
      
      if (hasOtherInjury && injuryDetails.other.status) {
        const detail = injuryDetails.other;
        const injuryInfo = [
          'Other',
          `Status: ${detail.status}`,
          detail.timeframe ? `Timeframe: ${detail.timeframe}` : '',
          detail.severity ? `Severity: ${detail.severity}` : '',
          detail.description ? `Description: ${detail.description}` : '',
          detail.limitations ? `Limitations: ${detail.limitations}` : '',
        ].filter(Boolean).join(' | ');
        injuryList.push(injuryInfo);
      }
    }
    
    // Save training background with separate cardio and strength training
    updateTrainingBackground({
      cardio_training_months: cardioExperienceOptions[selectedCardioExp].value,
      strength_training_months: strengthExperienceOptions[selectedStrengthExp].value,
      injury_history: injuryList,
      // Store both values for compatibility
      total_training_months: Math.max(
        cardioExperienceOptions[selectedCardioExp].value,
        strengthExperienceOptions[selectedStrengthExp].value
      ),
    });

    if (isEditMode) {
      handleClose();
    } else {
      setCurrentStep(5);
      navigation.navigate('ScheduleLifestyle');
    }
  };

  // Components are now defined outside to prevent re-rendering issues
  // See definitions at top of file
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isEditMode && (
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>Edit Training Background</Text>
        </View>
      )}

      {!isEditMode && (
        <View style={styles.header}>
          <Text style={styles.title}>Training Background</Text>
          <Text style={styles.subtitle}>Help us understand your experience level</Text>
        </View>
      )}
      
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Cardio Training Experience</Text>
          <Text style={styles.hint}>Running, cycling, swimming, rowing, etc.</Text>
          {cardioExperienceOptions.map((option, index) => (
            <RadioOption
              key={`cardio-${option.value}`}
              label={option.label}
              description={option.description}
              selected={selectedCardioExp === index}
              onPress={() => setSelectedCardioExp(index)}
            />
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Strength Training Experience</Text>
          <Text style={styles.hint}>Weights, resistance training, powerlifting, etc.</Text>
          {strengthExperienceOptions.map((option, index) => (
            <RadioOption
              key={`strength-${option.value}`}
              label={option.label}
              description={option.description}
              selected={selectedStrengthExp === index}
              onPress={() => setSelectedStrengthExp(index)}
            />
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Current or Past Injuries</Text>
          <Text style={styles.hint}>Select any areas that need special attention and provide details</Text>
          
          <CheckBox
            title="No injuries or limitations"
            checked={injuries.none}
            onPress={() => handleInjuryToggle('none')}
            containerStyle={styles.checkboxFull}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          
          {!injuries.none && (
            <>
              <View style={styles.injuryGrid}>
                {(['shoulder', 'back', 'knee', 'ankle', 'wrist', 'hip', 'elbow', 'neck'] as const).map(bodyPart => (
                  <View key={bodyPart} style={styles.injuryItem}>
                    <CheckBox
                      title={bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)}
                      checked={injuries[bodyPart]}
                      onPress={() => handleInjuryToggle(bodyPart)}
                      containerStyle={styles.checkbox}
                      textStyle={styles.checkboxText}
                      checkedColor={theme.colors.primary[400]}
                    />
                    {injuries[bodyPart] && (
                      <InjuryDetailForm
                        bodyPart={bodyPart}
                        detail={injuryDetails[bodyPart]}
                        onUpdate={(field, value) => {
                          setInjuryDetails({
                            ...injuryDetails,
                            [bodyPart]: {
                              ...injuryDetails[bodyPart],
                              [field]: value
                            }
                          });
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>
              
              <CheckBox
                title="Other injury or condition"
                checked={hasOtherInjury}
                onPress={() => {
                  setHasOtherInjury(!hasOtherInjury);
                  if (hasOtherInjury) {
                    setInjuryDetails({ ...injuryDetails, other: '' });
                  }
                }}
                containerStyle={styles.checkboxFull}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              
              {hasOtherInjury && (
                <InjuryDetailForm
                  bodyPart="other"
                  detail={injuryDetails.other}
                  onUpdate={(field, value) => {
                    setInjuryDetails({
                      ...injuryDetails,
                      other: {
                        ...injuryDetails.other,
                        [field]: value
                      }
                    });
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>
      
      <View style={styles.footer}>
        {!isEditMode && <Text style={styles.progress}>Step 4 of 6</Text>}
        <Button
          title={isEditMode ? "Save" : "Continue"}
          onPress={handleNext}
          buttonStyle={styles.continueButton}
          titleStyle={styles.continueButtonText}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  hint: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  radioOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  radioOptionSelected: {
    borderColor: theme.colors.primary[400],
    backgroundColor: `${theme.colors.primary[400]}15`,
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary[400],
  },
  radioText: {
    flex: 1,
  },
  radioLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: theme.colors.primary[400],
    fontWeight: '600',
  },
  radioDescription: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  injuryGrid: {
    marginTop: theme.spacing.sm,
  },
  injuryItem: {
    marginBottom: theme.spacing.sm,
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: theme.spacing.xs,
  },
  checkboxFull: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    marginVertical: theme.spacing.xs,
  },
  checkboxText: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    fontWeight: '400',
  },
  injuryDetailForm: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  injuryFormTitle: {
    ...theme.typography.body.medium,
    color: theme.colors.primary[400],
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  detailSection: {
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    ...theme.typography.body.small,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  detailInputContainer: {
    paddingHorizontal: 0,
  },
  miniButtonGroup: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    height: 36,
  },
  miniButtonText: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
  },
  smallInput: {
    ...theme.typography.body.small,
    color: theme.colors.text,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
    color: theme.colors.text,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
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
  continueButtonText: {
    ...theme.typography.button.large,
    fontWeight: '600',
  },
  editHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  editTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text,
    textAlign: 'center',
  },
});