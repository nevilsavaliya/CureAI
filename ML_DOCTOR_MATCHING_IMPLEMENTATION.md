# ML-Based Doctor Matching Implementation Guide

## Overview

This document describes the implementation of ML-based doctor matching that shows doctors based on detected diseases from the chatbot symptom analysis.

## Features Implemented

### 1. Disease-to-Specialization Mapping Service
- **File**: `backend/services/diseaseSpecializationMapping.js`
- Maps 100+ diseases to appropriate medical specializations
- Supports multiple specializations per disease
- Provides confidence-based ranking

### 2. Enhanced Doctor Model
- **File**: `backend/models/Doctor.js`
- Updated to support multiple specializations per doctor
- New field: `specializations` (array of strings)
- Maintains backward compatibility with `speciality` field

### 3. ML-Based Doctor Matching Algorithm
- **File**: `backend/controllers/doctorController.js`
- Matches doctors based on predicted disease specializations
- Scoring algorithm:
  - Specialization match: 40 points per match
  - Experience: 2 points per year
  - Rating: 10 points per star
- Returns top 10 matched doctors sorted by score

### 4. Enhanced Prediction Service
- **File**: `backend/services/predictionService.js`
- Automatically determines recommended specializations from predicted diseases
- Stores recommendations in prediction model

### 5. Database Cleanup Script
- **File**: `backend/scripts/cleanDatabase.js`
- Removes all user data (patients, doctors, symptoms, predictions, messages, consultations)
- Preserves admin accounts
- Run with: `npm run clean`

## How It Works

### Patient Flow

1. **Patient submits symptoms** via chatbot
   ```
   POST /api/symptoms
   Body: { symptomText: "I have fever, headache, and body pain" }
   ```

2. **System predicts diseases** and recommends specializations
   ```json
   {
     "diseases": [
       { "name": "Influenza", "confidence": 85 },
       { "name": "Dengue", "confidence": 60 }
     ],
     "recommendedSpecializations": [
       "General Medicine",
       "Internal Medicine",
       "Infectious Disease"
     ]
   }
   ```

3. **Frontend requests matched doctors**
   ```
   GET /api/doctors/match?specializations=General Medicine,Internal Medicine,Infectious Disease
   ```

4. **System returns ranked doctors**
   ```json
   {
     "doctors": [
       {
         "name": "Dr. Smith",
         "specializations": ["General Medicine", "Internal Medicine"],
         "experienceYears": 15,
         "rating": 4.8,
         "matchScore": 110
       }
     ]
   }
   ```

## Database Cleanup

To start fresh with new data:

```bash
cd backend
npm run clean
```

This will delete:
- ✅ All patients
- ✅ All doctors
- ✅ All symptoms
- ✅ All predictions
- ✅ All messages
- ✅ All consultations
- ✅ All feedback
- ℹ️ Admins are preserved

## Frontend Integration

### Update Patient Dashboard Component

The patient dashboard should:

1. **After symptom submission**, store the recommended specializations
2. **When loading doctors**, pass specializations to the API
3. **Display matched doctors** with match scores

Example code for `patient-dashboard.component.ts`:

```typescript
// After symptom submission
submitSymptom() {
  this.symptomService.submitSymptom(this.symptomText).subscribe({
    next: (response) => {
      this.prediction = response.prediction;
      this.recommendedSpecializations = response.prediction.recommendedSpecializations;
      
      // Load matched doctors
      this.loadMatchedDoctors();
    }
  });
}

// Load doctors based on specializations
loadMatchedDoctors() {
  const params = {
    specializations: this.recommendedSpecializations.join(',')
  };
  
  this.doctorService.getMatchedDoctors(params).subscribe({
    next: (response) => {
      this.doctors = response.doctors;
    }
  });
}
```

### Update Doctor Service

Add method to get matched doctors:

```typescript
getMatchedDoctors(params: any): Observable<any> {
  return this.http.get(`${this.apiUrl}/doctors/match`, { params });
}
```

## Available Specializations

The system supports 40+ medical specializations:

- General Medicine
- Internal Medicine
- Cardiology
- Neurology
- Orthopedics
- Dermatology
- Pediatrics
- Psychiatry
- Pulmonology
- Gastroenterology
- Endocrinology
- Rheumatology
- Urology
- Nephrology
- Gynecology
- Obstetrics
- Ophthalmology
- ENT (Ear, Nose, Throat)
- Oncology
- Hematology
- Infectious Disease
- Allergy & Immunology
- Emergency Medicine
- Critical Care
- And more...

## Doctor Signup with Multiple Specializations

### Current Implementation

Doctors can currently select one specialization during signup. To support multiple specializations:

### Option 1: Comma-Separated Input (Simple)

Update the signup form to accept comma-separated specializations:

```html
<div class="form-group">
  <label for="specializations">Specializations (comma-separated)</label>
  <input 
    type="text" 
    id="specializations" 
    formControlName="specializations"
    placeholder="e.g., General Medicine, Internal Medicine"
    class="form-control"
  />
  <small>Enter multiple specializations separated by commas</small>
</div>
```

Backend will split and process:

```javascript
// In authController.js
const specializationsInput = req.body.specializations;
const specializations = specializationsInput
  .split(',')
  .map(s => s.trim())
  .filter(s => s.length > 0);
```

### Option 2: Multi-Select Dropdown (Advanced)

Use Angular Material or similar library for multi-select:

```html
<mat-form-field>
  <mat-label>Specializations</mat-label>
  <mat-select formControlName="specializations" multiple>
    <mat-option *ngFor="let spec of availableSpecializations" [value]="spec">
      {{spec}}
    </mat-option>
  </mat-select>
</mat-form-field>
```

### Option 3: Checkbox List (User-Friendly)

```html
<div class="specializations-list">
  <label>Select Your Specializations:</label>
  <div *ngFor="let spec of availableSpecializations" class="checkbox-item">
    <input 
      type="checkbox" 
      [value]="spec"
      (change)="onSpecializationChange($event, spec)"
    />
    <label>{{spec}}</label>
  </div>
</div>
```

## Testing the Implementation

### 1. Clean Database

```bash
cd backend
npm run clean
```

### 2. Create Test Doctor with Multiple Specializations

```bash
# Using API or MongoDB directly
POST /api/auth/signup/doctor
{
  "name": "Dr. Test",
  "email": "test@doctor.com",
  "password": "test123",
  "dateOfBirth": "1980-01-01",
  "degree": "MBBS, MD",
  "specializations": ["General Medicine", "Internal Medicine", "Infectious Disease"],
  "experienceYears": 10
}
```

### 3. Test Patient Symptom Submission

```bash
POST /api/symptoms
Authorization: Bearer <patient_token>
{
  "symptomText": "I have fever, headache, and body pain for 3 days"
}
```

Expected response includes `recommendedSpecializations`.

### 4. Test Doctor Matching

```bash
GET /api/doctors/match?specializations=General Medicine,Internal Medicine
Authorization: Bearer <patient_token>
```

Should return doctors with matching specializations, sorted by match score.

## API Endpoints

### Get All Specializations

```
GET /api/doctors/specializations
```

Returns list of all available specializations.

### Match Doctors

```
GET /api/doctors/match?specializations=<comma-separated-list>
Authorization: Bearer <token>
```

Returns matched doctors with scores.

### Submit Symptoms

```
POST /api/symptoms
Authorization: Bearer <patient_token>
Body: { "symptomText": "symptoms description" }
```

Returns prediction with recommended specializations.

## Configuration

### Disease Mapping

To add new disease-specialization mappings, edit:
`backend/services/diseaseSpecializationMapping.js`

```javascript
const diseaseSpecializationMap = {
  'New Disease': ['Specialization1', 'Specialization2'],
  // ...
};
```

### Match Scoring Algorithm

To adjust scoring weights, edit:
`backend/controllers/doctorController.js`

```javascript
matchScore = (matchCount * 40) + (doctor.experienceYears * 2) + (doctor.rating * 10);
```

Adjust the multipliers:
- `40` - Weight for specialization match
- `2` - Weight for experience years
- `10` - Weight for rating

## Next Steps

1. **Update Frontend**:
   - Modify patient dashboard to use recommended specializations
   - Update doctor signup to support multiple specializations
   - Display match scores in doctor list

2. **Enhance ML Algorithm**:
   - Add patient history analysis
   - Consider geographic proximity
   - Factor in doctor availability

3. **Add Features**:
   - Doctor availability calendar
   - Patient preferences (language, gender)
   - Insurance compatibility

4. **Testing**:
   - Create comprehensive test cases
   - Test with various symptom combinations
   - Validate match scoring accuracy

## Troubleshooting

### Doctors Not Showing Up

1. Check doctor has active subscription
2. Verify doctor's specializations match predicted diseases
3. Ensure doctor's `isActive` is true

### Incorrect Specialization Recommendations

1. Review disease mapping in `diseaseSpecializationMapping.js`
2. Check symptom text parsing in prediction service
3. Verify disease confidence scores

### Match Scores Seem Wrong

1. Review scoring algorithm weights
2. Check doctor experience and rating values
3. Verify specialization matching logic

## Summary

The ML-based doctor matching system is now implemented and ready to use. It provides intelligent doctor recommendations based on symptom analysis and disease prediction, improving the patient experience and ensuring they see the most relevant doctors for their condition.

To activate:
1. Run `npm run clean` to clear old data
2. Create new doctors with multiple specializations
3. Test symptom submission and doctor matching
4. Update frontend to display matched doctors with scores
