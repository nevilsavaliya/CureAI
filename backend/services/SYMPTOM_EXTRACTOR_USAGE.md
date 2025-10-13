# Symptom Extraction Service - Usage Guide

## Overview

The Symptom Extraction Service automatically extracts medical symptoms from patient messages and stores them in patient records. This enables hospitals to access comprehensive symptom history via the Hospital API.

## Features

- **Automatic Extraction**: Symptoms are automatically extracted when patients send messages
- **Comprehensive Keywords**: 40+ symptom categories with multiple keyword variations
- **Smart Matching**: Uses word boundaries to avoid false positives
- **Duplicate Prevention**: Avoids storing duplicate symptoms for the same case
- **Audit Trail**: Tracks when and where symptoms were extracted

## Automatic Processing

Symptoms are automatically extracted when:
- A patient sends a message in a case
- The message is of type 'text'
- The message contains symptom keywords

No manual intervention required!

## Manual Usage

### Extract Symptoms from Text

```javascript
const { extractSymptomsFromText } = require('./services/symptomExtractor');

const text = "I have a fever and headache, also feeling nauseous";
const symptoms = extractSymptomsFromText(text);
// Returns: ['fever', 'headache', 'nausea']
```

### Process a Single Message

```javascript
const { processMessageForSymptoms } = require('./services/symptomExtractor');

const result = await processMessageForSymptoms(message);
// Returns: {
//   processed: true,
//   symptomsFound: 3,
//   symptoms: ['fever', 'headache', 'nausea'],
//   patientId: '...'
// }
```

### Process All Messages in a Case

```javascript
const { processCaseMessages } = require('./services/symptomExtractor');

const result = await processCaseMessages(caseId);
// Returns: {
//   processed: true,
//   messagesProcessed: 15,
//   totalSymptoms: 8,
//   uniqueSymptoms: ['fever', 'cough', 'headache', ...]
// }
```

### Get Patient Symptoms

```javascript
const { getPatientSymptoms } = require('./services/symptomExtractor');

const symptoms = await getPatientSymptoms(patientId);
// Returns array of extracted symptoms with metadata
```

## Symptom Categories

The service recognizes 40+ symptom categories including:

### General Symptoms
- fever, fatigue, pain

### Respiratory
- cough, shortness of breath, sore throat, congestion, wheezing

### Gastrointestinal
- nausea, vomiting, diarrhea, constipation, stomach ache, bloating

### Neurological
- headache, dizziness, confusion, numbness

### Cardiovascular
- chest pain, palpitations

### Musculoskeletal
- joint pain, back pain, muscle pain

### Skin
- rash, itching, swelling

### Eye & Ear
- blurred vision, eye pain, earache, hearing loss

### Urinary
- frequent urination, painful urination

### Mental Health
- anxiety, depression, insomnia

### Other
- chills, sweating, loss of appetite, weight changes

## Data Structure

Extracted symptoms are stored in the Patient model:

```javascript
{
  extractedSymptoms: [{
    symptom: 'fever',              // Symptom name
    extractedFrom: 'chat',         // Source: 'chat', 'consultation', 'manual'
    extractedAt: Date,             // When it was extracted
    caseId: ObjectId               // Related case
  }]
}
```

## Integration Points

### Message Controller
- Automatically processes patient messages in `sendCaseMessage()`
- Runs asynchronously to avoid blocking message sending
- Errors are logged but don't affect message delivery

### Hospital API
- Extracted symptoms are included in patient data responses
- Provides comprehensive symptom history for emergency access

## Error Handling

The service is designed to fail gracefully:
- If symptom extraction fails, the message is still saved
- Errors are logged for debugging
- Returns structured error responses

## Testing

To test symptom extraction:

```javascript
// Test with sample text
const { extractSymptomsFromText } = require('./services/symptomExtractor');

const testCases = [
  "I have a fever and cough",
  "My head hurts and I feel dizzy",
  "Experiencing chest pain and shortness of breath"
];

testCases.forEach(text => {
  const symptoms = extractSymptomsFromText(text);
  console.log(`Text: "${text}"`);
  console.log(`Symptoms: ${symptoms.join(', ')}\n`);
});
```

## Performance Considerations

- Symptom extraction is fast (< 10ms for typical messages)
- Runs asynchronously to avoid blocking
- Uses efficient regex matching with word boundaries
- Prevents duplicate storage

## Future Enhancements

Potential improvements:
- Machine learning-based symptom extraction
- Severity detection (mild, moderate, severe)
- Symptom duration tracking
- Symptom relationships and patterns
- Multi-language support

## Support

For issues or questions about symptom extraction:
1. Check the logs for error messages
2. Verify patient messages are being saved correctly
3. Test with the manual extraction functions
4. Review the SYMPTOM_KEYWORDS object for coverage
