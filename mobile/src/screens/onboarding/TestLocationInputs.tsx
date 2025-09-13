import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { theme } from '../../constants/theme';

export default function TestLocationInputs() {
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [gymName, setGymName] = useState('');
  
  const testInputs = () => {
    console.log('=== Testing Input Values ===');
    console.log('Home Address:', homeAddress);
    console.log('Work Address:', workAddress);
    console.log('Gym Name:', gymName);
    console.log('========================');
    
    Alert.alert(
      'Input Test Results',
      `Home: ${homeAddress || '[empty]'}\nWork: ${workAddress || '[empty]'}\nGym: ${gymName || '[empty]'}`
    );
  };
  
  const fillTestData = () => {
    setHomeAddress('123 Main Street, Denver, CO');
    setWorkAddress('456 Office Park, Denver, CO');
    setGymName('Movement Baker');
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Testing Input Fields</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Home Address</Text>
        <TextInput
          style={styles.input}
          value={homeAddress}
          onChangeText={(text) => {
            console.log('Home input changed:', text);
            setHomeAddress(text);
          }}
          placeholder="Enter home address"
          placeholderTextColor="#999"
        />
        <Text style={styles.value}>Current value: {homeAddress}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Work Address</Text>
        <TextInput
          style={styles.input}
          value={workAddress}
          onChangeText={(text) => {
            console.log('Work input changed:', text);
            setWorkAddress(text);
          }}
          placeholder="Enter work address"
          placeholderTextColor="#999"
        />
        <Text style={styles.value}>Current value: {workAddress}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Gym Name</Text>
        <TextInput
          style={styles.input}
          value={gymName}
          onChangeText={(text) => {
            console.log('Gym input changed:', text);
            setGymName(text);
          }}
          placeholder="Enter gym name"
          placeholderTextColor="#999"
        />
        <Text style={styles.value}>Current value: {gymName}</Text>
      </View>
      
      <View style={styles.buttons}>
        <Button title="Fill Test Data" onPress={fillTestData} />
        <Button title="Test Inputs" onPress={testInputs} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  value: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  buttons: {
    marginTop: 20,
    gap: 10,
  },
});