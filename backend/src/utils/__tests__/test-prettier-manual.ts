/**
 * Manual test script for Prettier formatter
 * Run this to see how single-line code is formatted
 */

import { formatCodeFile } from '../prettier-formatter';

async function testFormatter() {
  console.log('🧪 Testing Prettier Formatter\n');
  console.log('=' .repeat(60));

  // Test 1: Single-line React component
  console.log('\n📝 Test 1: Single-line React component');
  console.log('Input (single line):');
  const reactCode = "import React from 'react'; export default function App() { return <div className='app'><h1>Hello World</h1><p>This is a test</p></div>; }";
  console.log(reactCode);
  
  const formattedReact = await formatCodeFile('App.tsx', reactCode);
  console.log('\nOutput (formatted):');
  console.log(formattedReact);

  // Test 2: Single-line JavaScript with complex logic
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 2: Single-line JavaScript with logic');
  console.log('Input (single line):');
  const jsCode = "const users = [{name: 'Alice', age: 25}, {name: 'Bob', age: 30}]; function getAdults(users) { return users.filter(u => u.age >= 18).map(u => u.name); } export default getAdults;";
  console.log(jsCode);
  
  const formattedJs = await formatCodeFile('utils.js', jsCode);
  console.log('\nOutput (formatted):');
  console.log(formattedJs);

  // Test 3: Single-line JSON
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 3: Single-line package.json');
  console.log('Input (single line):');
  const jsonCode = '{"name":"my-app","version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"tsc && vite build"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"}}';
  console.log(jsonCode);
  
  const formattedJson = await formatCodeFile('package.json', jsonCode);
  console.log('\nOutput (formatted):');
  console.log(formattedJson);

  // Test 4: Single-line CSS
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 4: Single-line CSS');
  console.log('Input (single line):');
  const cssCode = "body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; } .app { max-width: 1200px; margin: 0 auto; padding: 20px; }";
  console.log(cssCode);
  
  const formattedCss = await formatCodeFile('styles.css', cssCode);
  console.log('\nOutput (formatted):');
  console.log(formattedCss);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All tests completed!\n');
}

// Run tests
testFormatter().catch(console.error);
