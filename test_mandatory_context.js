const detectPII = require('./backend/utils/piiDetector');

console.log('='.repeat(70));
console.log('BANK ACCOUNT MANDATORY CONTEXT TEST');
console.log('Bank accounts are ONLY detected when context keywords are present');
console.log('='.repeat(70));

// Test cases WITHOUT context - should NOT be detected
const withoutContext = [
  { text: '50155012345', reason: 'Valid format but NO context' },
  { text: '918273645012345', reason: 'Valid 15-digit but NO context' },
  { text: '071918210009932', reason: 'Valid SBI format but NO context' },
  { text: 'The number is 50155012345', reason: 'Has number but NO banking context' },
  { text: 'Call 918273645012 for details', reason: 'Random 12-digit number, NO context' },
];

// Test cases WITH context - should be detected at 100%
const withContext = [
  { text: 'Account number: 50155012345', reason: 'Has "account number" keyword' },
  { text: 'Bank account: 918273645012345', reason: 'Has "bank account" keyword' },
  { text: 'Please transfer to a/c 071918210009932', reason: 'Has "a/c" keyword' },
  { text: 'My account details: 50155012345', reason: 'Has "account details" keyword' },
  { text: 'Account: 918273645012345', reason: 'Has "account" keyword' },
];

// Test cases that should be blocked even WITH context (fail validation)
const blockedWithContext = [
  { text: 'Account: 444411115555', reason: 'Has context but fails validation (repeating)' },
  { text: 'Bank account: 1234567891234567', reason: 'Has context but 16-digit (credit card)' },
  { text: 'A/C: 123456789012', reason: 'Has context but sequential pattern' },
];

console.log('\n❌ WITHOUT CONTEXT (should NOT be detected):');
console.log('-'.repeat(70));

withoutContext.forEach(({ text, reason }) => {
  const result = detectPII(text);
  const detected = result.bankAccount ? '❌ DETECTED' : '✅ NOT DETECTED';
  const confidence = result.bankAccount ? ` (${result.bankAccount[0].confidence}%)` : '';
  console.log(`${detected} ${confidence.padEnd(8)} | ${reason}`);
});

console.log('\n✅ WITH CONTEXT (should be detected at 100%):');
console.log('-'.repeat(70));

withContext.forEach(({ text, reason }) => {
  const result = detectPII(text);
  const detected = result.bankAccount ? '✅ DETECTED' : '❌ NOT DETECTED';
  const confidence = result.bankAccount ? ` (${result.bankAccount[0].confidence}%)` : '';
  const value = result.bankAccount ? result.bankAccount[0].value : '';
  console.log(`${detected} ${confidence.padEnd(8)} | ${value.padEnd(18)} | ${reason}`);
});

console.log('\n🚫 BLOCKED EVEN WITH CONTEXT (fail validation):');
console.log('-'.repeat(70));

blockedWithContext.forEach(({ text, reason }) => {
  const result = detectPII(text);
  const detected = result.bankAccount ? '❌ DETECTED' : '✅ BLOCKED';
  const confidence = result.bankAccount ? ` (${result.bankAccount[0].confidence}%)` : '';
  console.log(`${detected} ${confidence.padEnd(8)} | ${reason}`);
});

console.log('\n' + '='.repeat(70));
console.log('MANDATORY CONTEXT REQUIREMENT:');
console.log('='.repeat(70));
console.log('✓ Context keywords: "account", "account number", "bank account",');
console.log('                    "a/c", "account details"');
console.log('✓ Context window: 120 characters before and after the number');
console.log('✓ Confidence: 100% (when context present + validation passed)');
console.log('✓ Without context: NOT DETECTED (prevents false positives)');
console.log('='.repeat(70));

console.log('\n📊 DETECTION LOGIC:');
console.log('-'.repeat(70));
console.log('1. Regex match (11-18 digits, excluding 16-digit credit cards)');
console.log('2. Check for context keywords (MANDATORY)');
console.log('3. If no context → SKIP (not detected)');
console.log('4. If context present → Apply RBI validation rules');
console.log('5. If validation passes → Detect at 100% confidence');
console.log('='.repeat(70));
