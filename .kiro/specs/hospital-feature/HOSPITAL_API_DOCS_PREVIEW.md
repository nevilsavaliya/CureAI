# Hospital API Documentation Component - Preview

## 🎯 Component Overview

The Hospital API Documentation component provides comprehensive, interactive documentation for hospitals to integrate with the patient data API.

## 📍 Access

**Route:** `/hospital/api-docs`

**Access Control:**
- Protected by AuthGuard
- Requires hospital role
- Accessible from hospital dashboard

## 🎨 Visual Design

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│  Hospital API Documentation                                  │
│  Comprehensive guide to accessing patient medical data       │
│  via API                                                      │
│  [Purple gradient background]                                │
└─────────────────────────────────────────────────────────────┘
```

### Sticky Navigation Bar
```
┌─────────────────────────────────────────────────────────────┐
│ Overview | Authentication | API Endpoint | Request Format | │
│ Response Format | Code Examples | Error Codes | Rate Limit  │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Content Sections

### 1. Overview Section
- **Purpose:** Introduction to the API
- **Features:**
  - Key features list (8 items)
  - Important usage notes
  - Emergency situation context
  - Info box with important notice

**Visual Elements:**
- ✅ Checkmark feature list
- ℹ️ Info box with blue background
- Clean typography

### 2. Authentication Section
- **Purpose:** Explain API credentials
- **Features:**
  - API Key format explanation
  - API Secret format explanation
  - Security warnings
  - Authentication requirements

**Visual Elements:**
- Credential cards with gray background
- ⚠️ Warning box with yellow background
- Code examples for credential format

### 3. API Endpoint Section
- **Purpose:** Show the main endpoint
- **Features:**
  - HTTP method badge (POST - green)
  - Full endpoint path
  - Description
  - Authentication type
  - Base URL

**Visual Elements:**
- Endpoint card with gray background
- Green POST badge
- Monospace font for endpoint path

### 4. Request Format Section
- **Purpose:** Document request structure
- **Features:**
  - Request headers
  - Request body JSON
  - Parameter table
  - Required/optional badges

**Visual Elements:**
- Dark code blocks
- Copy button for JSON
- Table with parameters
- Red "Required" badges

**Parameter Table:**
```
┌──────────────┬────────┬──────────┬─────────────────────┐
│ Parameter    │ Type   │ Required │ Description         │
├──────────────┼────────┼──────────┼─────────────────────┤
│ apiKey       │ string │ Required │ Your hospital's key │
│ apiSecret    │ string │ Required │ Your secret (64ch)  │
│ patientEmail │ string │ Required │ Patient's email     │
└──────────────┴────────┴──────────┴─────────────────────┘
```

### 5. Response Format Section
- **Purpose:** Show response structure
- **Features:**
  - Complete success response JSON
  - Field descriptions by category
  - Real example data

**Visual Elements:**
- Dark code block with JSON
- Copy button
- Organized field groups with purple accent

**Field Categories:**
- Patient Information
- Emergency Contact
- Medical History
- Clinical Data
- Access Information

### 6. Code Examples Section
- **Purpose:** Provide integration code
- **Features:**
  - 4 programming languages
  - Interactive language tabs
  - Copy-to-clipboard
  - Complete working examples

**Languages:**
1. **cURL** - Command-line
2. **JavaScript** - Browser fetch
3. **Node.js** - Axios library
4. **Python** - Requests library

**Visual Elements:**
```
┌─────────────────────────────────────────────────────────────┐
│ [cURL] [JavaScript] [Node.js] [Python]                      │
├─────────────────────────────────────────────────────────────┤
│ CURL                                      [📋 Copy Code]    │
├─────────────────────────────────────────────────────────────┤
│ curl -X POST https://api.example.com/... \                  │
│   -H "Content-Type: application/json" \                     │
│   -d '{                                                      │
│     "apiKey": "HK_...",                                      │
│     "apiSecret": "...",                                      │
│     "patientEmail": "..."                                    │
│   }'                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 7. Error Codes Section
- **Purpose:** Document error responses
- **Features:**
  - 6 HTTP status codes
  - Error messages
  - Detailed descriptions
  - Common scenarios

**Error Codes:**
- 400 - Bad Request (yellow)
- 401 - Unauthorized (red)
- 403 - Forbidden (red)
- 404 - Not Found (blue)
- 429 - Too Many Requests (yellow)
- 500 - Internal Server Error (red)

**Visual Elements:**
- Color-coded error table
- Error code badges
- Scenario cards with examples

**Error Table:**
```
┌──────┬─────────────────────┬──────────────────────────────┐
│ Code │ Message             │ Description                  │
├──────┼─────────────────────┼──────────────────────────────┤
│ 400  │ Bad Request         │ Missing required fields      │
│ 401  │ Unauthorized        │ Invalid API credentials      │
│ 404  │ Not Found           │ Patient doesn't exist        │
│ 429  │ Too Many Requests   │ Rate limit exceeded          │
└──────┴─────────────────────┴──────────────────────────────┘
```

### 8. Rate Limiting Section
- **Purpose:** Explain rate limits
- **Features:**
  - Rate limit card (100/hour)
  - Header documentation
  - Best practices
  - Code example

**Visual Elements:**
- Purple gradient rate limit card
- ⏱️ Timer icon
- Large "100 Requests per 1 hour" display
- Best practices box (green)

**Rate Limit Headers:**
```
┌──────────────────────┬─────────────────────┬─────────┐
│ Header               │ Description         │ Example │
├──────────────────────┼─────────────────────┼─────────┤
│ X-RateLimit-Limit    │ Max requests/hour   │ 100     │
│ X-RateLimit-Remaining│ Requests remaining  │ 95      │
│ X-RateLimit-Reset    │ Reset timestamp     │ 163...  │
└──────────────────────┴─────────────────────┴─────────┘
```

### 9. Support Section
- **Purpose:** Provide help resources
- **Features:**
  - Email support
  - Documentation links
  - Live chat info

**Visual Elements:**
- Purple gradient background
- 3 support cards
- Icons: 📧 📚 💬

## 🎯 Interactive Features

### Copy Functionality
- ✅ Copy API endpoint
- ✅ Copy request JSON
- ✅ Copy response JSON
- ✅ Copy code examples (all languages)
- ✅ Toast notifications on copy

### Navigation
- ✅ Sticky navigation bar
- ✅ Active section highlighting
- ✅ Smooth scroll to sections
- ✅ Click navigation links

### Language Switcher
- ✅ Tab-based language selection
- ✅ Active tab highlighting
- ✅ Instant code switching
- ✅ 4 languages supported

## 📱 Responsive Design

### Desktop (1200px+)
- Full-width content (max 1200px)
- Multi-column layouts
- Large code blocks
- Spacious padding

### Tablet (768px - 1199px)
- Adjusted column layouts
- Responsive tables
- Maintained readability

### Mobile (< 768px)
- Single column layout
- Stacked cards
- Scrollable tables
- Touch-friendly buttons
- Smaller font sizes
- Reduced padding

## 🎨 Color Scheme

### Primary Colors
- **Purple-Blue:** `#667eea` (headers, accents)
- **Dark Purple:** `#764ba2` (gradients)

### Status Colors
- **Success:** `#10b981` (green)
- **Warning:** `#f59e0b` (orange)
- **Danger:** `#ef4444` (red)
- **Info:** `#3b82f6` (blue)

### Neutral Colors
- **Background:** `#f5f5f5`
- **Card Background:** `#ffffff`
- **Code Background:** `#1f2937` (dark)
- **Text:** `#111827` to `#6b7280`

## 🔧 Technical Details

### Component Structure
```
hospital-api-docs/
├── hospital-api-docs.component.ts    (Logic)
├── hospital-api-docs.component.html  (Template)
└── hospital-api-docs.component.css   (Styles)
```

### Key Methods
- `setActiveSection(section)` - Navigate to section
- `setActiveLanguage(language)` - Switch code language
- `getCodeExample(language)` - Get code for language
- `copyCode(language)` - Copy code to clipboard
- `copyJson(json)` - Copy JSON to clipboard
- `scrollToSection(sectionId)` - Smooth scroll

### Data Structures
- `ApiEndpoint` - Endpoint information
- `ErrorCode` - Error code details
- `CodeExample` - Code sample structure

## 📊 Content Statistics

- **Total Sections:** 9
- **Code Languages:** 4
- **Error Codes:** 6
- **Rate Limit Headers:** 3
- **Feature List Items:** 8
- **Field Categories:** 5
- **Support Cards:** 3

## 🚀 Usage Flow

1. **Hospital logs in** → Dashboard
2. **Clicks "API Documentation"** → Navigates to `/hospital/api-docs`
3. **Reads overview** → Understands purpose
4. **Checks authentication** → Gets credential format
5. **Views endpoint** → Knows where to send requests
6. **Copies request format** → Uses in their code
7. **Selects language** → Gets code example
8. **Copies code** → Integrates into their system
9. **Checks error codes** → Handles errors properly
10. **Reviews rate limits** → Plans API usage

## ✨ Key Highlights

### Professional Design
- Modern, clean interface
- Consistent styling
- Professional color scheme
- Smooth animations

### Comprehensive Content
- Complete API documentation
- Real-world examples
- Best practices
- Security considerations

### Developer-Friendly
- Copy-paste ready code
- Multiple languages
- Clear explanations
- Interactive features

### Accessible
- Semantic HTML
- Keyboard navigation
- Screen reader friendly
- High contrast

## 🎯 Success Metrics

### User Experience
- ✅ Easy to navigate
- ✅ Quick to find information
- ✅ Copy-paste functionality
- ✅ Mobile responsive

### Content Quality
- ✅ Complete documentation
- ✅ Clear examples
- ✅ Error handling
- ✅ Best practices

### Technical Quality
- ✅ No compilation errors
- ✅ Clean code
- ✅ Proper TypeScript types
- ✅ Angular best practices

## 🔄 Integration Points

### From Hospital Dashboard
```typescript
goToApiDocs(): void {
  this.router.navigate(['/hospital/api-docs']);
}
```

### Route Configuration
```typescript
{ 
  path: 'hospital/api-docs', 
  component: HospitalApiDocsComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['hospital'] }
}
```

## 📝 Summary

The Hospital API Documentation component is a comprehensive, professional, and user-friendly documentation page that provides hospitals with everything they need to integrate with the patient data API. It includes detailed endpoint documentation, request/response examples, code samples in 4 languages, error codes reference, and rate limiting information, all presented in a modern, responsive design with interactive features.
