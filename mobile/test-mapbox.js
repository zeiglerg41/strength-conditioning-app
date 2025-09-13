// Test Mapbox POI search for gyms
// Run with: node test-mapbox.js

const MAPBOX_TOKEN = 'pk.YOUR_PUBLIC_TOKEN_HERE'; // YOU NEED A PUBLIC TOKEN!
// The sk. token in your .env is a SECRET key - DO NOT use in client code

async function testMapboxSearch() {
  // Denver coordinates
  const lat = 39.7392;
  const lon = -104.9903;
  
  // Test searches
  const searches = [
    'Movement Baker',
    'LA Fitness',
    'Vasa Fitness',
    'Denver wash park rec center'
  ];
  
  console.log('Testing Mapbox POI search near Denver, CO\n');
  
  for (const query of searches) {
    console.log(`Searching for: "${query}"`);
    
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: '5',
      types: 'poi',
      proximity: `${lon},${lat}`,
    });
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        console.log(`Found ${data.features.length} results:`);
        data.features.forEach((feature, i) => {
          console.log(`  ${i + 1}. ${feature.text} - ${feature.place_name}`);
        });
      } else {
        console.log('  No results found');
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Note about API keys:
console.log('IMPORTANT: You have a SECRET key (sk.) in your .env file.');
console.log('For client-side apps, you need a PUBLIC token (pk.)');
console.log('');
console.log('To get a public token:');
console.log('1. Go to https://account.mapbox.com/');
console.log('2. Click on "Tokens" in the navigation');
console.log('3. Either use the "Default public token" or create a new public token');
console.log('4. Update your .env file with: EXPO_PUBLIC_MAPBOX_API_KEY=pk.YOUR_TOKEN_HERE');
console.log('');
console.log('Secret keys (sk.) are only for server-side use and should NEVER be in mobile apps!');
console.log('');

// Uncomment when you have a public token:
// testMapboxSearch();