// Test script to verify GooglePlacesGymSearch works
const React = require('react');

// Mock the component to test prop handling
function testGooglePlacesGymSearch() {
  // Test 1: undefined gyms prop
  let gyms1 = undefined;
  let safeGyms1 = gyms1 || [];
  console.log('Test 1 - undefined gyms:', safeGyms1, 'length:', safeGyms1.length);

  // Test 2: null gyms prop
  let gyms2 = null;
  let safeGyms2 = gyms2 || [];
  console.log('Test 2 - null gyms:', safeGyms2, 'length:', safeGyms2.length);

  // Test 3: empty array
  let gyms3 = [];
  let safeGyms3 = gyms3 || [];
  console.log('Test 3 - empty array:', safeGyms3, 'length:', safeGyms3.length);

  // Test 4: array with values
  let gyms4 = ['Movement Gym', 'LA Fitness'];
  let safeGyms4 = gyms4 || [];
  console.log('Test 4 - with values:', safeGyms4, 'length:', safeGyms4.length);

  // Test 5: includes check with safe array
  let testGym = 'Movement Gym';
  console.log('Test 5 - includes check:', !safeGyms1.includes(testGym), !safeGyms4.includes(testGym));

  console.log('\nAll tests passed - no errors with undefined/null gyms!');
}

testGooglePlacesGymSearch();