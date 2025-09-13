import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button, Card } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList, RootStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';

type Props = StackScreenProps<OnboardingStackParamList, 'Review'>;

export default function ReviewScreen({ navigation }: Props) {
  const { data, submitOnboarding } = useOnboardingStore();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitOnboarding();
      // Navigate back to main app
      rootNavigation.navigate('Main');
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'Unable to save your profile. Please check your connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      console.error('Onboarding submission failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatEquipment = (equipment: string[]) => {
    if (!equipment || equipment.length === 0) return 'None selected';
    return equipment.map(e => e.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
  };
  
  const formatList = (items: string[]) => {
    if (!items || items.length === 0) return 'None';
    return items.join(', ');
  };
  
  const formatHeightImperial = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Your Profile</Text>
        <Text style={styles.subtitle}>Make sure everything looks good</Text>
      </View>
      
      <View style={styles.cards}>
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>1. Basic Information</Text>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.profile.name || 'Not provided'}</Text>
            
            <Text style={styles.label}>Birthday:</Text>
            <Text style={styles.value}>{data.profile.birthday || 'Not provided'} (Age {data.profile.age})</Text>
            
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{data.profile.gender || 'Not provided'}</Text>
            
            <Text style={styles.label}>Height:</Text>
            <Text style={styles.value}>
              {data.profile.height 
                ? data.profile.units_preference === 'imperial' 
                  ? `${formatHeightImperial(data.profile.height)}`
                  : `${data.profile.height}cm`
                : 'Not provided'}
            </Text>
            
            <Text style={styles.label}>Weight:</Text>
            <Text style={styles.value}>
              {data.profile.weight 
                ? data.profile.units_preference === 'imperial'
                  ? `${Math.round(data.profile.weight * 2.205)} lbs`
                  : `${data.profile.weight} kg`
                : 'Not provided'}
            </Text>
            
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{data.profile.location || 'Not provided'}</Text>
          </View>
        </Card>
        
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>2. Location & Privacy</Text>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Home Location:</Text>
            <Text style={styles.value}>
              {data.location_privacy?.home_location || 'Not provided'} 
              ({data.location_privacy?.home_location_type || 'exact'})
            </Text>
            
            <Text style={styles.label}>Work Location:</Text>
            <Text style={styles.value}>
              {data.location_privacy?.work_location || 'Not provided'} 
              ({data.location_privacy?.work_location_type || 'exact'})
            </Text>
            
            <Text style={styles.label}>Run/Bike Commute Interest:</Text>
            <Text style={styles.value}>{data.location_privacy?.would_consider_commute || 'Not specified'}</Text>
            
            <Text style={styles.label}>Location Permission:</Text>
            <Text style={styles.value}>{data.location_privacy?.location_permission ? 'Granted' : 'Not granted'}</Text>
          </View>
        </Card>
        
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>3. Training Locations</Text>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Primary Location:</Text>
            <Text style={styles.value}>
              {data.training_locations?.primary_location?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
            </Text>
            
            {data.training_locations?.gym_name && (
              <>
                <Text style={styles.label}>Gym Name:</Text>
                <Text style={styles.value}>{data.training_locations.gym_name}</Text>
              </>
            )}
            
            {data.training_locations?.home_equipment && data.training_locations.home_equipment.length > 0 && (
              <>
                <Text style={styles.label}>Home Equipment:</Text>
                <Text style={styles.value}>{formatList(data.training_locations.home_equipment)}</Text>
              </>
            )}
            
            <Text style={styles.label}>Secondary Locations:</Text>
            <Text style={styles.value}>{formatList(data.training_locations?.secondary_locations || [])}</Text>
            
            <Text style={styles.label}>Outdoor Training:</Text>
            <Text style={styles.value}>{data.training_locations?.outdoor_willing ? 'Yes' : 'No'}</Text>
          </View>
        </Card>
        
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>4. Training Background</Text>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Strength Training Experience:</Text>
            <Text style={styles.value}>{data.training_background.strength_experience || 'Not specified'}</Text>
            
            <Text style={styles.label}>Cardio Training Experience:</Text>
            <Text style={styles.value}>{data.training_background.cardio_experience || 'Not specified'}</Text>
            
            <Text style={styles.label}>Sports Background:</Text>
            <Text style={styles.value}>{formatList(data.training_background.sports_background || [])}</Text>
            
            <Text style={styles.label}>Current Injuries:</Text>
            <Text style={styles.value}>
              {data.training_background.injury_status ? 
                `Yes - ${data.training_background.injury_notes || 'Details provided'}` : 
                'None'}
            </Text>
            
            <Text style={styles.label}>Previous Injuries:</Text>
            <Text style={styles.value}>{data.training_background.previous_injuries || 'None'}</Text>
          </View>
        </Card>
        
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>5. Schedule & Lifestyle</Text>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Sessions per Week:</Text>
            <Text style={styles.value}>{data.schedule_lifestyle?.sessions_per_week || 'Not specified'}</Text>
            
            <Text style={styles.label}>Minutes per Session:</Text>
            <Text style={styles.value}>{data.schedule_lifestyle?.minutes_per_session || 'Not specified'}</Text>
            
            <Text style={styles.label}>Preferred Training Times:</Text>
            <Text style={styles.value}>{data.schedule_lifestyle?.preferred_time?.replace(/,/g, ', ') || 'Not specified'}</Text>
            
            <Text style={styles.label}>Work Schedule:</Text>
            <Text style={styles.value}>
              {data.schedule_lifestyle?.work_schedule?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
            </Text>
            
            <Text style={styles.label}>Sleep Quality:</Text>
            <Text style={styles.value}>{data.schedule_lifestyle?.sleep_quality || 'Not specified'}</Text>
            
            <Text style={styles.label}>Stress Level:</Text>
            <Text style={styles.value}>{data.schedule_lifestyle?.stress_level || 'Not specified'}</Text>
            
            <Text style={styles.label}>Other Physical Activities:</Text>
            <Text style={styles.value}>{formatList(data.schedule_lifestyle?.other_activities || [])}</Text>
          </View>
        </Card>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.progress}>Step 6 of 6</Text>
        
        <Button
          title={loading ? '' : 'Complete Setup'}
          onPress={handleSubmit}
          disabled={loading}
          buttonStyle={styles.submitButton}
          titleStyle={styles.submitButtonText}
          icon={loading ? <ActivityIndicator color="white" size="small" /> : undefined}
        />
        
        <Button
          title="Go Back & Edit"
          onPress={() => navigation.goBack()}
          type="outline"
          buttonStyle={styles.editButton}
          titleStyle={styles.editButtonText}
          disabled={loading}
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
  cards: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.heading.h4,
    color: theme.colors.primary[400],
    marginBottom: theme.spacing.sm,
  },
  cardContent: {
    paddingTop: theme.spacing.xs,
  },
  label: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  value: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
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
  submitButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  submitButtonText: {
    ...theme.typography.button.large,
    fontWeight: '600',
  },
  editButton: {
    borderColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  editButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.primary[400],
  },
});