/**
 * Test script to demonstrate geofencing functionality
 * Run with: node server/utils/testGeofencing.js
 */

const { isWithinKottayam, getKottayamCenter, calculateDistance } = require('./geofencing');

console.log('🗺️  Geofencing Test for Kanjirapally Panchayath\n');
console.log('='.repeat(60));

// Test cases with various locations
const testLocations = [
  {
    name: 'Kanjirapally Center (Exact)',
    lat: 9.5595,
    lng: 76.7874,
    expected: true
  },
  {
    name: 'Within 5km North',
    lat: 9.6045,
    lng: 76.7874,
    expected: true
  },
  {
    name: 'Within 10km East',
    lat: 9.5595,
    lng: 76.8774,
    expected: true
  },
  {
    name: 'Within 15km South',
    lat: 9.4245,
    lng: 76.7874,
    expected: true
  },
  {
    name: 'Within 17km West',
    lat: 9.5595,
    lng: 76.6344,
    expected: true
  },
  {
    name: 'Just outside boundary (25km North)',
    lat: 9.7845,
    lng: 76.7874,
    expected: false
  },
  {
    name: 'Kottayam City (Outside - 20km West)',
    lat: 9.5916,
    lng: 76.5222,
    expected: false
  },
  {
    name: 'Pala (Outside - 15km Northwest)',
    lat: 9.7274,
    lng: 76.6828,
    expected: false
  }
];

console.log('\n📍 Testing Various Locations:\n');

testLocations.forEach((location, index) => {
  const result = isWithinKottayam(location.lat, location.lng);
  const passed = result.isInside === location.expected;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  console.log(`${index + 1}. ${location.name}`);
  console.log(`   Coordinates: (${location.lat}, ${location.lng})`);
  console.log(`   Result: ${result.isInside ? 'INSIDE' : 'OUTSIDE'} Kanjirapally`);
  console.log(`   Expected: ${location.expected ? 'INSIDE' : 'OUTSIDE'}`);
  console.log(`   Status: ${status}`);
  console.log(`   Message: ${result.message}`);
  
  // Calculate distance from Kanjirapally center
  const center = getKottayamCenter();
  const distance = calculateDistance(
    location.lat, 
    location.lng, 
    center.latitude, 
    center.longitude
  );
  console.log(`   Distance from Kanjirapally center: ${distance.toFixed(2)} km`);
  console.log('');
});

console.log('='.repeat(60));

// Summary
const totalTests = testLocations.length;
const passed = testLocations.filter((loc, i) => {
  const result = isWithinKottayam(loc.lat, loc.lng);
  return result.isInside === loc.expected;
}).length;

console.log('\n📊 Test Summary:');
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${totalTests - passed}`);
console.log(`   Success Rate: ${((passed / totalTests) * 100).toFixed(1)}%`);

if (passed === totalTests) {
  console.log('\n🎉 All geofencing tests passed! ✨\n');
} else {
  console.log('\n⚠️  Some tests failed. Review the geofencing boundaries.\n');
}

