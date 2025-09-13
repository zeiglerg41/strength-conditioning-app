import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, CheckBox } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { OnboardingStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { TextInput } from 'react-native';
import GymSearchInput from '../../components/GymSearchInput';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import UniversalSearchInput from '../../components/UniversalSearchInput';
import GooglePlacesGymSearch from '../../components/GooglePlacesGymSearch';

type Props = StackScreenProps<OnboardingStackParamList, 'TrainingLocations'>;

export default function TrainingLocationsScreen({ navigation }: Props) {
  const { data, updateTrainingLocations, updateEquipment, setCurrentStep } = useOnboardingStore();
  
  // Available locations (can select multiple)
  const [hasCommercialGym, setHasCommercialGym] = useState(
    data.training_locations?.has_commercial_gym !== false
  );
  const [hasHomeGym, setHasHomeGym] = useState(
    data.training_locations?.has_home_gym || false
  );
  const [hasOutdoorSpace, setHasOutdoorSpace] = useState(
    data.training_locations?.has_outdoor_space || false
  );
  
  // Commercial gym details - now supports multiple gyms
  const [currentGymName, setCurrentGymName] = useState('');
  const [gyms, setGyms] = useState<string[]>(
    data.training_locations?.gym_names || []
  );
  
  // Home equipment
  const [homeEquipment, setHomeEquipment] = useState({
    barbell: false,
    dumbbells: false,
    kettlebells: false,
    pullupBar: false,
    bands: false,
    bench: false,
    rack: false,
    cardio: false,
  });
  
  // Secondary locations
  const [secondaryLocations, setSecondaryLocations] = useState({
    parkNearby: false,
    trackAccess: false,
    poolAccess: false,
    trailsNearby: false,
  });
  
  const [outdoorWilling, setOutdoorWilling] = useState(
    data.training_locations?.outdoor_willing !== false
  );

  // Outdoor facility locations
  const [facilityLocations, setFacilityLocations] = useState({
    parkLocation: data.training_locations?.facility_locations?.park || '',
    trackLocation: data.training_locations?.facility_locations?.track || '',
    poolLocation: data.training_locations?.facility_locations?.pool || '',
  });

  const addGym = () => {
    const trimmedName = currentGymName.trim();
    console.log('=== ADD GYM DEBUG ===');
    console.log('Attempting to add gym:', trimmedName);
    console.log('Current gyms list:', gyms);
    
    if (trimmedName && !gyms.includes(trimmedName)) {
      const newGyms = [...gyms, trimmedName];
      setGyms(newGyms);
      setCurrentGymName(''); // This should clear the input
      console.log('✅ Gym added! New list:', newGyms);
      console.log('✅ Input cleared, currentGymName set to empty string');
    } else if (gyms.includes(trimmedName)) {
      console.log('❌ Gym already in list, not adding duplicate');
    } else {
      console.log('❌ Empty gym name, not adding');
    }
    console.log('===================');
  };

  const removeGym = (index: number) => {
    console.log('Removing gym at index:', index, 'Gym:', gyms[index]);
    const newGyms = gyms.filter((_, i) => i !== index);
    setGyms(newGyms);
    console.log('Updated gyms list:', newGyms);
  };
  
  const handleNext = () => {
    // Validate at least one location is selected
    if (!hasCommercialGym && !hasHomeGym && !hasOutdoorSpace) {
      Alert.alert('Required', 'Please select at least one training location');
      return;
    }
    
    // Validate gym details if commercial gym is selected
    if (hasCommercialGym && gyms.length === 0 && !currentGymName.trim()) {
      Alert.alert('Required Field', 'Please add at least one gym');
      return;
    }
    
    // Auto-add current gym if user typed but didn't click add
    let finalGyms = [...gyms];
    if (hasCommercialGym && currentGymName.trim() && !gyms.includes(currentGymName.trim())) {
      finalGyms.push(currentGymName.trim());
    }
    
    // Validate home equipment if home gym is selected
    if (hasHomeGym) {
      const hasEquipment = Object.values(homeEquipment).some(v => v);
      if (!hasEquipment) {
        Alert.alert('Equipment Required', 'Please select at least one piece of equipment you have at home');
        return;
      }
    }
    
    // Prepare equipment list
    const equipment = [];
    if (homeEquipment.barbell) equipment.push('Barbell & plates');
    if (homeEquipment.dumbbells) equipment.push('Dumbbells');
    if (homeEquipment.kettlebells) equipment.push('Kettlebells');
    if (homeEquipment.pullupBar) equipment.push('Pull-up bar');
    if (homeEquipment.bands) equipment.push('Resistance bands');
    if (homeEquipment.bench) equipment.push('Bench');
    if (homeEquipment.rack) equipment.push('Squat rack');
    if (homeEquipment.cardio) equipment.push('Cardio equipment');
    
    // Prepare secondary locations
    const secondary = [];
    if (secondaryLocations.parkNearby) secondary.push('Park nearby');
    if (secondaryLocations.trackAccess) secondary.push('Track access');
    if (secondaryLocations.poolAccess) secondary.push('Pool access');
    if (secondaryLocations.trailsNearby) secondary.push('Trails nearby');
    
    // Determine primary location based on selections
    let primaryLoc = 'commercial_gym';
    if (hasCommercialGym && hasHomeGym) primaryLoc = 'multiple';
    else if (hasHomeGym && !hasCommercialGym) primaryLoc = 'home';
    else if (hasOutdoorSpace && !hasCommercialGym && !hasHomeGym) primaryLoc = 'outdoor';
    
    // Save training locations
    updateTrainingLocations({
      primary_location: primaryLoc as any,
      has_commercial_gym: hasCommercialGym,
      has_home_gym: hasHomeGym,
      has_outdoor_space: hasOutdoorSpace,
      gym_names: hasCommercialGym ? finalGyms : undefined,
      home_equipment: hasHomeGym ? equipment : undefined,
      secondary_locations: secondary,
      outdoor_willing: outdoorWilling,
      facility_locations: {
        park: secondaryLocations.parkNearby ? facilityLocations.parkLocation : undefined,
        track: secondaryLocations.trackAccess ? facilityLocations.trackLocation : undefined,
        pool: secondaryLocations.poolAccess ? facilityLocations.poolLocation : undefined,
      },
    });
    
    // Also update equipment_access for backwards compatibility
    updateEquipment({
      training_location: primaryLoc as any,
      equipment_available: hasHomeGym ? equipment : 
                          hasCommercialGym ? ['Full gym equipment'] : [],
      notes: secondary.join(', '),
    });
    
    setCurrentStep(4);
    navigation.navigate('TrainingBackground');
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}>
      <View style={styles.header}>
        <Text style={styles.title}>Training Locations</Text>
        <Text style={styles.subtitle}>Select all locations where you train</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Available Training Locations</Text>
          <Text style={styles.hint}>Check all that apply - we'll create programs that work for all your locations</Text>
          
          <CheckBox
            title="Commercial Gym (LA Fitness, Gold's, etc.)"
            checked={hasCommercialGym}
            onPress={() => setHasCommercialGym(!hasCommercialGym)}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          
          <CheckBox
            title="Home Gym / Home Equipment"
            checked={hasHomeGym}
            onPress={() => setHasHomeGym(!hasHomeGym)}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          
          <CheckBox
            title="Outdoor Training Space"
            checked={hasOutdoorSpace}
            onPress={() => setHasOutdoorSpace(!hasOutdoorSpace)}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
        </View>
        
        {hasCommercialGym && (
          <View style={styles.section}>
            <Text style={styles.label}>Gym Name(s) *</Text>
            <Text style={styles.hint}>Add all gyms you have access to</Text>

            <GooglePlacesGymSearch
              onAddGym={(gym) => {
                if (gym && !gyms.includes(gym)) {
                  setGyms([...gyms, gym]);
                  setCurrentGymName('');
                }
              }}
              gyms={gyms}
            />

            {gyms.length > 0 && (
              <View style={styles.gymsList}>
                {gyms.map((gym, index) => (
                  <View key={index} style={styles.gymItem}>
                    <Text style={styles.gymItemText}>{gym}</Text>
                    <TouchableOpacity onPress={() => removeGym(index)}>
                      <Ionicons name="close-circle" size={20} color={theme.colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        
        {hasHomeGym && (
          <View style={styles.section}>
            <Text style={styles.label}>Home Gym Equipment *</Text>
            <Text style={styles.hint}>Select all equipment you have access to at home</Text>
            
            <View style={styles.equipmentGrid}>
              <CheckBox
                title="Barbell & Plates"
                checked={homeEquipment.barbell}
                onPress={() => setHomeEquipment({...homeEquipment, barbell: !homeEquipment.barbell})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Dumbbells"
                checked={homeEquipment.dumbbells}
                onPress={() => setHomeEquipment({...homeEquipment, dumbbells: !homeEquipment.dumbbells})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Kettlebells"
                checked={homeEquipment.kettlebells}
                onPress={() => setHomeEquipment({...homeEquipment, kettlebells: !homeEquipment.kettlebells})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Pull-up Bar"
                checked={homeEquipment.pullupBar}
                onPress={() => setHomeEquipment({...homeEquipment, pullupBar: !homeEquipment.pullupBar})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Resistance Bands"
                checked={homeEquipment.bands}
                onPress={() => setHomeEquipment({...homeEquipment, bands: !homeEquipment.bands})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Bench"
                checked={homeEquipment.bench}
                onPress={() => setHomeEquipment({...homeEquipment, bench: !homeEquipment.bench})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Squat Rack"
                checked={homeEquipment.rack}
                onPress={() => setHomeEquipment({...homeEquipment, rack: !homeEquipment.rack})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
              <CheckBox
                title="Cardio Equipment"
                checked={homeEquipment.cardio}
                onPress={() => setHomeEquipment({...homeEquipment, cardio: !homeEquipment.cardio})}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor={theme.colors.primary[400]}
              />
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.label}>Additional Training Options</Text>
          <Text style={styles.hint}>Select any secondary locations you can access</Text>
          
          <CheckBox
            title="Park nearby for outdoor workouts"
            checked={secondaryLocations.parkNearby}
            onPress={() => setSecondaryLocations({...secondaryLocations, parkNearby: !secondaryLocations.parkNearby})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          
          {secondaryLocations.parkNearby && (
            <View style={styles.facilityLocationInput}>
              <Text style={styles.facilityLabel}>Park Location</Text>
              <View style={styles.facilityOptions}>
                {gyms.length > 0 && (
                  <View>
                    <Text style={styles.optionLabel}>Link to existing gym:</Text>
                    {gyms.map((gym, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.gymOption, facilityLocations.parkLocation === gym && styles.selectedGym]}
                        onPress={() => setFacilityLocations({...facilityLocations, parkLocation: gym})}
                      >
                        <Text style={[styles.gymOptionText, facilityLocations.parkLocation === gym && styles.selectedGymText]}>{gym}</Text>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.orText}>OR</Text>
                  </View>
                )}
                <UniversalSearchInput
                  value={facilityLocations.parkLocation.startsWith('gym:') ? '' : facilityLocations.parkLocation}
                  onChangeText={(text) => setFacilityLocations({...facilityLocations, parkLocation: text})}
                  onSelectPlace={(place) => setFacilityLocations({...facilityLocations, parkLocation: place.name})}
                  placeholder="Search for park (e.g. Harvey Park)"
                  searchType="park"
                  icon="leaf"
                />
              </View>
            </View>
          )}
          <CheckBox
            title="Access to running track"
            checked={secondaryLocations.trackAccess}
            onPress={() => setSecondaryLocations({...secondaryLocations, trackAccess: !secondaryLocations.trackAccess})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          
          {secondaryLocations.trackAccess && (
            <View style={styles.facilityLocationInput}>
              <Text style={styles.facilityLabel}>Track Location</Text>
              <View style={styles.facilityOptions}>
                {gyms.length > 0 && (
                  <View>
                    <Text style={styles.optionLabel}>Link to existing gym:</Text>
                    {gyms.map((gym, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.gymOption, facilityLocations.trackLocation === gym && styles.selectedGym]}
                        onPress={() => setFacilityLocations({...facilityLocations, trackLocation: gym})}
                      >
                        <Text style={[styles.gymOptionText, facilityLocations.trackLocation === gym && styles.selectedGymText]}>{gym}</Text>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.orText}>OR</Text>
                  </View>
                )}
                <UniversalSearchInput
                  value={facilityLocations.trackLocation.startsWith('gym:') ? '' : facilityLocations.trackLocation}
                  onChangeText={(text) => setFacilityLocations({...facilityLocations, trackLocation: text})}
                  onSelectPlace={(place) => setFacilityLocations({...facilityLocations, trackLocation: place.name})}
                  placeholder="Search for outdoor track"
                  searchType="any"
                  icon="ellipse"
                />
              </View>
            </View>
          )}
          <CheckBox
            title="Swimming pool access"
            checked={secondaryLocations.poolAccess}
            onPress={() => setSecondaryLocations({...secondaryLocations, poolAccess: !secondaryLocations.poolAccess})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
          
          {secondaryLocations.poolAccess && (
            <View style={styles.facilityLocationInput}>
              <Text style={styles.facilityLabel}>Pool Location</Text>
              <View style={styles.facilityOptions}>
                {gyms.length > 0 && (
                  <View>
                    <Text style={styles.optionLabel}>Link to existing gym:</Text>
                    {gyms.map((gym, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.gymOption, facilityLocations.poolLocation === gym && styles.selectedGym]}
                        onPress={() => setFacilityLocations({...facilityLocations, poolLocation: gym})}
                      >
                        <Text style={[styles.gymOptionText, facilityLocations.poolLocation === gym && styles.selectedGymText]}>{gym}</Text>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.orText}>OR</Text>
                  </View>
                )}
                <UniversalSearchInput
                  value={facilityLocations.poolLocation.startsWith('gym:') ? '' : facilityLocations.poolLocation}
                  onChangeText={(text) => setFacilityLocations({...facilityLocations, poolLocation: text})}
                  onSelectPlace={(place) => setFacilityLocations({...facilityLocations, poolLocation: place.name})}
                  placeholder="Search for pool"
                  searchType="any"
                  icon="water"
                />
              </View>
            </View>
          )}
          <CheckBox
            title="Trails for running/hiking"
            checked={secondaryLocations.trailsNearby}
            onPress={() => setSecondaryLocations({...secondaryLocations, trailsNearby: !secondaryLocations.trailsNearby})}
            containerStyle={styles.checkbox}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
        </View>
        
        <View style={styles.section}>
          <CheckBox
            title="I'm willing to train outdoors (weather permitting)"
            checked={outdoorWilling}
            onPress={() => setOutdoorWilling(!outdoorWilling)}
            containerStyle={[styles.checkbox, styles.standAloneCheckbox]}
            textStyle={styles.checkboxText}
            checkedColor={theme.colors.primary[400]}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.progress}>Step 3 of 6</Text>
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
  buttonGroupVertical: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'column',
    height: 'auto',
  },
  selectedButton: {
    backgroundColor: theme.colors.primary[400],
  },
  buttonText: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.sm,
  },
  selectedButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: theme.spacing.xs,
    marginLeft: 0,
    marginRight: 0,
  },
  standAloneCheckbox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text,
    height: '100%',
  },
  gymsList: {
    marginTop: theme.spacing.md,
  },
  gymItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gymItemText: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text,
  },
  facilityLocationInput: {
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary[200],
  },
  facilityLabel: {
    ...theme.typography.body.medium,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  facilityOptions: {
    gap: theme.spacing.sm,
  },
  optionLabel: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  gymOption: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedGym: {
    backgroundColor: theme.colors.primary[900], // Dark green background
    borderColor: theme.colors.primary[400], // Neon green border
  },
  gymOptionText: {
    ...theme.typography.body.small,
    color: theme.colors.text,
  },
  selectedGymText: {
    color: theme.colors.primary[400], // Neon green text when selected
    fontWeight: '600',
  },
  orText: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
  },
});