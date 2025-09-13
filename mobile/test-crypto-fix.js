// Test crypto.getRandomValues() error and fix for react-native-google-places-autocomplete
const React = require('react');

// Test the crypto issue
function testCryptoIssue() {
  console.log('=== Testing crypto.getRandomValues() Issue ===\n');

  // Test 1: Check if crypto exists in Node environment
  console.log('Test 1: Checking crypto availability');
  console.log('- global.crypto exists?', typeof global.crypto !== 'undefined');
  console.log('- crypto.getRandomValues exists?', typeof global.crypto?.getRandomValues === 'function');

  // Test 2: The error occurs because react-native doesn't have crypto.getRandomValues
  console.log('\nTest 2: React Native Environment');
  console.log('- React Native does NOT provide crypto.getRandomValues()');
  console.log('- Libraries using uuid v4 will fail without polyfill');

  // Test 3: Demonstrate the fix
  console.log('\nTest 3: Testing the fix (polyfill)');

  // This is what needs to be added to fix the issue
  const cryptoPolyfill = `
// Add to App.tsx or index.js before any other imports
import 'react-native-get-random-values';
  `;

  console.log('Fix required:', cryptoPolyfill);

  // Test 4: Alternative fix using uuid without crypto
  console.log('\nTest 4: Alternative - Use uuid v1 instead of v4');
  const alternativeFix = `
// Use timestamp-based UUID instead of random
import { v1 as uuidv1 } from 'uuid';
const id = uuidv1(); // No crypto needed
  `;
  console.log('Alternative:', alternativeFix);

  // Test 5: Check if the library is trying to generate UUIDs
  console.log('\nTest 5: Why GooglePlacesAutocomplete needs crypto');
  console.log('- The library generates session tokens using uuid v4');
  console.log('- Session tokens require crypto.getRandomValues()');
  console.log('- Without it, the component throws an error on mount');

  console.log('\n=== Solution ===');
  console.log('Install and import the polyfill:');
  console.log('1. npm install react-native-get-random-values');
  console.log('2. Add import at the TOP of App.tsx (before other imports)');
  console.log('3. This provides crypto.getRandomValues() for React Native');
}

testCryptoIssue();