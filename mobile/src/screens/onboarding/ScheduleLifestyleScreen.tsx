import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Button, ButtonGroup, CheckBox } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';

type Props = StackScreenProps<OnboardingStackParamList, 'ScheduleLifestyle'>;

export default function ScheduleLifestyleScreen({ navigation }: Props) {
  const { data, updateScheduleLifestyle, setCurrentStep } = useOnboardingStore();
  
  // Sessions per week (2-7)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(() => {
    const sessions = data.schedule_lifestyle?.sessions_per_week;
    return sessions ? sessions - 2 : 1; // Index 0 = 2 sessions, Index 1 = 3 sessions, etc.
  });
  const sessionOptions = ['2', '3', '4', '5', '6', '7'];
  
  // Minutes per session
  const [minutesPerSession, setMinutesPerSession] = useState(() => {
    const minutes = data.schedule_lifestyle?.minutes_per_session;
    if (minutes === 30) return 0;
    if (minutes === 45) return 1;
    if (minutes === 60) return 2;
    if (minutes === 90) return 3;
    if (minutes === 120) return 4;
    return 2; // default to 60
  });
  const minutesOptions = ['30 min', '45 min', '60 min', '90 min', '120+ min'];
  
  // Preferred training times (can select multiple)
  const [trainingTimes, setTrainingTimes] = useState({
    earlyMorning: false,
    morning: false,
    lunch: false,
    afternoon: false,
    evening: false,
    night: false,
    flexible: false,
  });
  
  // Weekend availability
  const [weekendAvailability, setWeekendAvailability] = useState(() => {
    const avail = data.schedule_lifestyle?.weekend_availability;
    // Convert old values: 'more' or 'same' = Yes (0), 'less' or 'no' = No (1)
    return avail === 'less' || avail === 'no' ? 1 : 0;
  });
  const weekendOptions = ['Yes', 'No'];
  
  // Work schedule
  const [workSchedule, setWorkSchedule] = useState(() => {
    const schedule = data.schedule_lifestyle?.work_schedule;
    if (schedule === 'second_shift') return 1;
    if (schedule === 'third_shift') return 2;
    if (schedule === 'irregular') return 3;
    if (schedule === 'flexible') return 4;
    return 0; // 9-5
  });
  const workOptions = ['9-5', '2nd Shift', '3rd Shift', 'Irregular', 'Flexible'];

  // Work schedule details (for Irregular/Flexible)
  const [workScheduleDetails, setWorkScheduleDetails] = useState(
    data.schedule_lifestyle?.work_schedule_details || ''
  );
  
  // Travel frequency
  const [travelFrequency, setTravelFrequency] = useState(() => {
    const travel = data.schedule_lifestyle?.travel_frequency;
    if (travel === 'sometimes') return 1;
    if (travel === 'frequently') return 2;
    return 0; // never
  });
  const travelOptions = ['Never', 'Sometimes', 'Frequently'];
  
  // Sleep quality
  const [sleepQuality, setSleepQuality] = useState(() => {
    const sleep = data.schedule_lifestyle?.sleep_quality;
    if (sleep === 'fair') return 1;
    if (sleep === 'good') return 2;
    if (sleep === 'excellent') return 3;
    return 0; // poor
  });
  const sleepOptions = ['Poor', 'Fair', 'Good', 'Excellent'];
  
  // Other physical activities
  const [otherActivities, setOtherActivities] = useState({
    sportsLeague: false,
    manualLabor: false,
    activeHobbies: false,
    activeCommute: false,
    none: false,
  });
  
  const handleNext = () => {
    // Collect selected training times
    const times = [];
    if (trainingTimes.earlyMorning) times.push('early_morning');
    if (trainingTimes.morning) times.push('morning');
    if (trainingTimes.lunch) times.push('lunch');
    if (trainingTimes.afternoon) times.push('afternoon');
    if (trainingTimes.evening) times.push('evening');
    if (trainingTimes.night) times.push('night');
    if (trainingTimes.flexible) times.push('flexible');
    
    // Collect other activities
    const activities = [];
    if (otherActivities.sportsLeague) activities.push('Sports league');
    if (otherActivities.manualLabor) activities.push('Manual labor job');
    if (otherActivities.activeHobbies) activities.push('Active hobbies');
    if (otherActivities.activeCommute) activities.push('Active commute');
    
    // Save schedule and lifestyle data
    const scheduleData: any = {
      sessions_per_week: sessionsPerWeek + 2, // Convert index back to actual sessions
      minutes_per_session: parseInt(minutesOptions[minutesPerSession]),
      preferred_time: times.join(','),
      weekend_availability: weekendAvailability === 0 ? 'yes' : 'no' as 'yes' | 'no',
      work_schedule: ['9-5', 'second_shift', 'third_shift', 'irregular', 'flexible'][workSchedule] as '9-5' | 'second_shift' | 'third_shift' | 'irregular' | 'flexible',
      travel_frequency: ['never', 'sometimes', 'frequently'][travelFrequency] as 'never' | 'sometimes' | 'frequently',
      sleep_quality: ['poor', 'fair', 'good', 'excellent'][sleepQuality] as 'poor' | 'fair' | 'good' | 'excellent',
      other_activities: activities,
    };

    // Add work schedule details if Irregular or Flexible
    if (workSchedule === 3 || workSchedule === 4) {
      scheduleData.work_schedule_details = workScheduleDetails;
    }

    updateScheduleLifestyle(scheduleData);
    
    setCurrentStep(6);
    navigation.navigate('Review');
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule & Lifestyle</Text>
        <Text style={styles.subtitle}>Help us fit training into your life</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Training Availability</Text>
          
          <Text style={styles.sublabel}>Sessions per week</Text>
          <ButtonGroup
            buttons={sessionOptions}
            selectedIndex={sessionsPerWeek}
            onPress={setSessionsPerWeek}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
          
          <Text style={styles.sublabel}>Time per session</Text>
          <ButtonGroup
            buttons={minutesOptions}
            selectedIndex={minutesPerSession}
            onPress={setMinutesPerSession}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
          
          <Text style={styles.sublabel}>Weekend availability</Text>
          <ButtonGroup
            buttons={weekendOptions}
            selectedIndex={weekendAvailability}
            onPress={setWeekendAvailability}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Training Times</Text>
          <Text style={styles.hint}>Select all that apply</Text>
          
          <View style={styles.checkboxGrid}>
            <CheckBox
              title="Early Morning (5-7am)"
              checked={trainingTimes.earlyMorning}
              onPress={() => setTrainingTimes({...trainingTimes, earlyMorning: !trainingTimes.earlyMorning})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
            <CheckBox
              title="Morning (7-10am)"
              checked={trainingTimes.morning}
              onPress={() => setTrainingTimes({...trainingTimes, morning: !trainingTimes.morning})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
            <CheckBox
              title="Lunch (11am-1pm)"
              checked={trainingTimes.lunch}
              onPress={() => setTrainingTimes({...trainingTimes, lunch: !trainingTimes.lunch})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
            <CheckBox
              title="Afternoon (2-5pm)"
              checked={trainingTimes.afternoon}
              onPress={() => setTrainingTimes({...trainingTimes, afternoon: !trainingTimes.afternoon})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
            <CheckBox
              title="Evening (5-8pm)"
              checked={trainingTimes.evening}
              onPress={() => setTrainingTimes({...trainingTimes, evening: !trainingTimes.evening})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
            <CheckBox
              title="Night (8pm+)"
              checked={trainingTimes.night}
              onPress={() => setTrainingTimes({...trainingTimes, night: !trainingTimes.night})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
            <CheckBox
              title="Flexible/Varies"
              checked={trainingTimes.flexible}
              onPress={() => setTrainingTimes({...trainingTimes, flexible: !trainingTimes.flexible})}
              containerStyle={styles.checkbox}
              textStyle={styles.checkboxText}
              checkedColor={theme.colors.primary[400]}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Life Factors</Text>
          
          <Text style={styles.sublabel}>Work schedule</Text>
          <ButtonGroup
            buttons={workOptions}
            selectedIndex={workSchedule}
            onPress={setWorkSchedule}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />

          {(workSchedule === 3 || workSchedule === 4) && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsLabel}>Please specify your schedule:</Text>
              <TextInput
                value={workScheduleDetails}
                onChangeText={setWorkScheduleDetails}
                placeholder="e.g., Rotating shifts every 2 weeks, Work from home 3 days/week"
                placeholderTextColor={theme.colors.placeholder}
                style={styles.detailsInput}
                multiline
                numberOfLines={2}
              />
            </View>
          )}
          
          <Text style={styles.sublabel}>Travel frequency</Text>
          <ButtonGroup
            buttons={travelOptions}
            selectedIndex={travelFrequency}
            onPress={setTravelFrequency}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />

          <Text style={styles.sublabel}>Sleep Quality (on average)</Text>
          <ButtonGroup
            buttons={sleepOptions}
            selectedIndex={sleepQuality}
            onPress={setSleepQuality}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Other Physical Activities</Text>
          <Text style={styles.hint}>These affect recovery needs</Text>
          
          <CheckBox
            title="Sports leagues (basketball, soccer, etc.)"
            checked={otherActivities.sportsLeague}
            onPress={() => setOtherActivities({...otherActivities, sportsLeague: !otherActivities.sportsLeague})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          <CheckBox
            title="Manual labor job"
            checked={otherActivities.manualLabor}
            onPress={() => setOtherActivities({...otherActivities, manualLabor: !otherActivities.manualLabor})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          <CheckBox
            title="Active hobbies (hiking, rock climbing, etc.)"
            checked={otherActivities.activeHobbies}
            onPress={() => setOtherActivities({...otherActivities, activeHobbies: !otherActivities.activeHobbies})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          <CheckBox
            title="Active commute (walk/bike to work)"
            checked={otherActivities.activeCommute}
            onPress={() => setOtherActivities({...otherActivities, activeCommute: !otherActivities.activeCommute})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          <CheckBox
            title="None of the above"
            checked={otherActivities.none}
            onPress={() => {
              if (!otherActivities.none) {
                setOtherActivities({
                  sportsLeague: false,
                  manualLabor: false,
                  activeHobbies: false,
                  activeCommute: false,
                  none: true,
                });
              } else {
                setOtherActivities({...otherActivities, none: false});
              }
            }}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.progress}>Step 5 of 6</Text>
        <Button
          title="Continue to Review"
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
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  sublabel: {
    ...theme.typography.body.small,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    fontWeight: '500',
  },
  hint: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  buttonGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    height: 48, // Fixed height for consistent alignment
  },
  selectedButton: {
    backgroundColor: theme.colors.primary[400],
  },
  buttonText: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlignVertical: 'center', // Center text vertically
  },
  selectedButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  checkboxGrid: {
    marginHorizontal: -theme.spacing.xs,
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: theme.spacing.xs,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: theme.spacing.xs,
  },
  checkboxText: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    fontWeight: '400',
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
  detailsContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  detailsLabel: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  detailsInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text,
    ...theme.typography.body.medium,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});