import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, ButtonGroup } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { OnboardingStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { initializeGeocoding } from '../../config/geocoding';

type Props = StackScreenProps<OnboardingStackParamList, 'LocationPrivacy'>;

export default function LocationPrivacyScreen({ navigation }: Props) {
  const { data, updateLocationPrivacy, setCurrentStep } = useOnboardingStore();
  
  // Initialize with saved data
  const [homeLocation, setHomeLocation] = useState(data.location_privacy?.home_location || '');
  const [homePrivacy, setHomePrivacy] = useState(
    data.location_privacy?.home_location_type === 'general' ? 1 : 0
  );
  const [workLocation, setWorkLocation] = useState(data.location_privacy?.work_location || '');
  const [workType, setWorkType] = useState(() => {
    if (data.location_privacy?.work_location_type === 'remote') return 2;
    if (data.location_privacy?.work_location_type === 'general') return 1;
    return 0;
  });
  const [locationPermission, setLocationPermission] = useState(
    data.location_privacy?.location_permission || false
  );
  const [commuteInterest, setCommuteInterest] = useState(() => {
    const interest = data.location_privacy?.would_consider_commute;
    if (interest === 'yes') return 0;
    if (interest === 'maybe') return 1;
    return 2;
  });
  
  
  useEffect(() => {
    // Initialize geocoding service on mount
    initializeGeocoding();
  }, []);
  
  const homePrivacyOptions = ['Exact Address', 'General Area'];
  const workOptions = ['Exact', 'Area', 'Remote'];
  const commuteOptions = ['Yes, definitely', 'Maybe', 'No'];
  
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        
        // Get current location if needed
        await Location.getCurrentPositionAsync({});
        
        Alert.alert(
          'Location Access Granted',
          'We can now suggest nearby gyms and calculate commute routes for your training.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'Location Access Denied',
          'You can still enter locations manually. Some features like gym suggestions will be limited.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };
  
  const handleNext = () => {
    // Validate required fields
    if (!homeLocation && homePrivacy === 0) {
      Alert.alert('Required Field', 'Please enter your home location or select general area');
      return;
    }
    
    if (workType !== 2 && !workLocation) {
      Alert.alert('Required Field', 'Please enter your work location or select remote/no commute');
      return;
    }
    
    // Save location data
    updateLocationPrivacy({
      home_location: homeLocation,
      home_location_type: homePrivacy === 0 ? 'exact' : 'general',
      work_location: workType === 2 ? 'remote' : workLocation,
      work_location_type: workType === 2 ? 'remote' : (workType === 1 ? 'general' : 'exact'),
      location_permission: locationPermission,
      would_consider_commute: ['yes', 'maybe', 'no'][commuteInterest] as 'yes' | 'maybe' | 'no',
    });
    
    setCurrentStep(3);
    navigation.navigate('TrainingLocations');
  };
  
  const InfoBox = ({ text }: { text: string }) => (
    <View style={styles.infoBox}>
      <Ionicons name="information-circle" size={20} color={theme.colors.primary[400]} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Location & Privacy</Text>
        <Text style={styles.subtitle}>
          Help us optimize your training around your daily routine
        </Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Location Permissions</Text>
          <InfoBox text="Location data helps us find gyms near you and calculate run/bike commute routes" />
          
          <TouchableOpacity
            style={[styles.permissionButton, locationPermission && styles.permissionGranted]}
            onPress={requestLocationPermission}
          >
            <Ionicons 
              name={locationPermission ? "checkmark-circle" : "location"} 
              size={24} 
              color={locationPermission ? theme.colors.success[500] : theme.colors.primary[400]} 
            />
            <Text style={[styles.permissionText, locationPermission && styles.permissionGrantedText]}>
              {locationPermission ? 'Location Access Granted' : 'Grant Location Access'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Home Location</Text>
          <ButtonGroup
            buttons={homePrivacyOptions}
            selectedIndex={homePrivacy}
            onPress={setHomePrivacy}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
          
          <AddressAutocomplete
            value={homeLocation}
            onChangeText={setHomeLocation}
            onSelectAddress={(address) => {
              setHomeLocation(address.place_name);
            }}
            placeholder={homePrivacy === 0 ? "Enter your home address" : "Enter neighborhood or area"}
            types={homePrivacy === 0 ? ['address'] : ['place', 'neighborhood']}
            icon={<Ionicons name="home" size={20} color={theme.colors.primary[400]} />}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Work Location</Text>
          <ButtonGroup
            buttons={workOptions}
            selectedIndex={workType}
            onPress={setWorkType}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
          
          {workType !== 2 && (
            <AddressAutocomplete
              value={workLocation}
              onChangeText={setWorkLocation}
              onSelectAddress={(address) => {
                setWorkLocation(address.place_name);
              }}
              placeholder={workType === 0 ? "Enter work address" : "Enter work area"}
              types={workType === 0 ? ['address'] : ['place', 'neighborhood']}
              icon={<Ionicons name="business" size={20} color={theme.colors.primary[400]} />}
            />
          )}
        </View>
        
        {workType !== 2 && (
          <View style={styles.section}>
            <Text style={styles.label}>Run/Bike Commute Interest</Text>
            <Text style={styles.hint}>
              Would you consider running or biking to work as part of your training?
            </Text>
            <ButtonGroup
              buttons={commuteOptions}
              selectedIndex={commuteInterest}
              onPress={setCommuteInterest}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
              textStyle={styles.buttonText}
              selectedTextStyle={styles.selectedButtonText}
            />
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.progress}>Step 2 of 6</Text>
        <Button
          title="Continue"
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
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  hint: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary[400]}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.body.small,
    color: theme.colors.text,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary[400],
    backgroundColor: theme.colors.surface,
  },
  permissionGranted: {
    borderColor: theme.colors.success[500],
    backgroundColor: `${theme.colors.success[500]}10`,
  },
  permissionText: {
    ...theme.typography.body.medium,
    color: theme.colors.primary[400],
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  permissionGrantedText: {
    color: theme.colors.success[500],
  },
  buttonGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    minHeight: 48,
  },
  selectedButton: {
    backgroundColor: theme.colors.primary[400],
  },
  buttonText: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xs,
    fontSize: 13,
  },
  selectedButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
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
});