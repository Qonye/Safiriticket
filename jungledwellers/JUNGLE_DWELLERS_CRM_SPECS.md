# Jungle Dwellers CRM - System Specifications & Plan

## Project Overview

Jungle Dwellers CRM is a comprehensive customer relationship management system specifically designed for safari tour operations. Unlike traditional CRMs, this system focuses on safari-specific workflows including custom itinerary creation, detailed inclusions/exclusions management, and flexible invoice generation.

## Core Philosophy

- **À La Carte Safari System**: Every safari is completely custom-built, no preset packages
- **Flexible Invoice Creation**: Invoices can be created independently or from bookings
- **Safari-Centric Design**: Built around safari tour operations with custom itineraries
- **Professional Branding**: Jungle Dwellers branded templates and styling
- **Comprehensive Details**: Detailed inclusions, exclusions, pricing, and passenger information
- **Template-Based Starting Points**: Optional templates to speed up custom safari creation

## Technology Stack

### Backend
- **Framework**: Next.js 15 (Latest as of September 2025)
- **Database**: MongoDB 7 with Mongoose 9
- **Authentication**: NextAuth.js 5
- **API**: Next.js API Routes (Serverless)
- **PDF Generation**: jsPDF 3 + html2canvas 2

### Frontend
- **Framework**: React 19 + Next.js 15
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Jungle Dwellers branding
- **Charts**: Chart.js 5 + react-chartjs-2 6

### Deployment
- **Platform**: Vercel (Serverless)
- **Database**: MongoDB Atlas
- **File Storage**: Vercel Blob Storage

## Database Schema

### 1. Client Model
```javascript
{
  name: String (required),
  email: String (required),
  phone: String,
  company: String,
  nationality: String,
  passportNumber: String,
  dateOfBirth: Date,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalRequirements: String,
  dietaryRequirements: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Safari Template Model (Optional Base Templates)
```javascript
{
  name: String (required), // e.g., "3-Day Masai Mara Classic", "7-Day Northern Circuit"
  description: String,
  duration: Number, // days
  suggestedMaxPax: Number,
  suggestedMinPax: Number,
  basePrice: Number, // suggested starting price
  currency: String (default: 'USD'),
  suggestedInclusions: [{
    item: String (required),
    description: String,
    category: {
      type: String,
      enum: ['accommodation', 'transportation', 'meals', 'activities', 'services', 'insurance', 'other'],
      default: 'services'
    },
    isOptional: Boolean (default: false) // can be removed from custom safari
  }],
  suggestedExclusions: [{
    item: String (required),
    description: String,
    category: {
      type: String,
      enum: ['accommodation', 'transportation', 'meals', 'activities', 'services', 'insurance', 'other'],
      default: 'services'
    }
  }],
  suggestedItinerary: [{
    dayNumber: Number,
    location: String,
    suggestedActivities: [String],
    suggestedAccommodation: {
      name: String,
      type: String,
      location: String
    },
    suggestedMeals: [String],
    suggestedTransportation: String,
    notes: String
  }],
  isActive: Boolean (default: true),
  isTemplate: Boolean (default: true), // distinguishes from custom safaris
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Booking Model (À La Carte Safari)
```javascript
{
  client: ObjectId (ref: 'Client', required),
  safariTemplate: ObjectId (ref: 'SafariTemplate'), // Optional - can start from template
  bookingNumber: String (unique, auto-generated),
  safariName: String (required), // Custom safari name
  startDate: Date (required),
  endDate: Date (required),
  duration: Number, // calculated from dates
  
  // Participants
  participants: [{
    name: String (required),
    age: Number,
    passportNumber: String,
    nationality: String,
    dietaryRequirements: String,
    medicalRequirements: String
  }],
  totalPax: Number (required),
  
  // Custom Itinerary (always custom, unlimited days)
  customItinerary: [{
    dayNumber: Number,
    date: Date,
    location: String,
    activities: [String], // unlimited activities per day
    accommodation: {
      name: String,
      type: String,
      location: String,
      cost: Number, // per person per night
      checkIn: Date,
      checkOut: Date
    },
    meals: [String], // unlimited meals per day
    transportation: {
      type: String, // "4x4 Vehicle", "Flight", "Boat", etc.
      details: String,
      cost: Number, // total cost
      departureTime: String,
      arrivalTime: String
    },
    notes: String,
    weather: String, // optional weather info
    specialInstructions: String // optional special instructions
  }],
  
  // Custom Inclusions (always custom, unlimited items)
  inclusions: [{
    item: String (required),
    description: String,
    category: {
      type: String,
      enum: ['accommodation', 'transportation', 'meals', 'activities', 'services', 'insurance', 'other'],
      default: 'services'
    },
    cost: Number, // per person or total
    isPerPerson: Boolean (default: true),
    quantity: Number (default: 1), // for items like "2 nights accommodation"
    totalCost: Number // calculated: cost * quantity * (totalPax if isPerPerson)
  }],
  
  // Custom Exclusions (always custom, unlimited items)
  exclusions: [{
    item: String (required),
    description: String,
    category: {
      type: String,
      enum: ['accommodation', 'transportation', 'meals', 'activities', 'services', 'insurance', 'other'],
      default: 'services'
    },
    reason: String // why it's excluded (optional)
  }],
  
  // À La Carte Pricing
  pricing: {
    basePrice: Number, // calculated from all items
    totalPrice: Number,
    currency: String (default: 'USD'),
    breakdown: [{
      item: String,
      description: String,
      category: String,
      quantity: Number,
      unitPrice: Number,
      total: Number,
      isPerPerson: Boolean
    }],
    discounts: [{
      item: String,
      description: String,
      amount: Number,
      type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' }
    }],
    taxes: [{
      name: String,
      rate: Number,
      amount: Number
    }]
  },
  
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  specialRequests: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Invoice Model
```javascript
{
  invoiceNumber: String (unique, auto-generated),
  client: ObjectId (ref: 'Client', required),
  booking: ObjectId (ref: 'Booking'), // Optional - can create invoice independently
  issueDate: Date (default: Date.now),
  dueDate: Date,
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  currency: String (default: 'USD'),
  
  // Safari Details (can be from booking or custom)
  safariDetails: {
    name: String,
    duration: Number,
    startDate: Date,
    endDate: Date,
    participants: [{
      name: String,
      age: Number,
      passportNumber: String,
      nationality: String
    }],
    totalPax: Number
  },
  
  // Itinerary (can be from booking or custom, unlimited days)
  itinerary: [{
    dayNumber: Number,
    date: Date,
    location: String,
    activities: [String], // unlimited activities per day
    accommodation: {
      name: String,
      type: String,
      location: String,
      checkIn: Date,
      checkOut: Date
    },
    meals: [String], // unlimited meals per day
    transportation: {
      type: String,
      details: String,
      departureTime: String,
      arrivalTime: String
    },
    notes: String,
    weather: String,
    specialInstructions: String
  }],
  
  // Inclusions & Exclusions (unlimited dynamic items)
  inclusions: [{
    item: String (required),
    description: String,
    category: {
      type: String,
      enum: ['accommodation', 'transportation', 'meals', 'activities', 'services', 'insurance', 'other'],
      default: 'services'
    },
    cost: Number,
    isPerPerson: Boolean (default: true),
    quantity: Number (default: 1),
    totalCost: Number
  }],
  exclusions: [{
    item: String (required),
    description: String,
    category: {
      type: String,
      enum: ['accommodation', 'transportation', 'meals', 'activities', 'services', 'insurance', 'other'],
      default: 'services'
    },
    reason: String
  }],
  
  // Pricing
  pricing: {
    basePrice: Number,
    additionalServices: [{
      item: String,
      description: String,
      quantity: Number,
      unitPrice: Number,
      total: Number
    }],
    discounts: [{
      item: String,
      description: String,
      amount: Number,
      type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' }
    }],
    taxes: [{
      name: String,
      rate: Number,
      amount: Number
    }],
    subtotal: Number,
    totalDiscounts: Number,
    totalTaxes: Number,
    totalAmount: Number
  },
  
  // Payment Details
  paymentDetails: {
    accountName: String (default: 'JUNGLE DWELLERS LTD'),
    accountNumber: String (default: '0254001002'),
    bankName: String (default: 'DIAMOND TRUST BANK'),
    swiftCode: String (default: 'DTKEKENA'),
    currency: String (default: 'USD'),
    additionalInfo: String
  },
  
  paidAmount: Number (default: 0),
  paidAt: Date,
  paymentMethod: String,
  paymentReference: String,
  
  // Terms & Conditions
  termsAndConditions: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 5. User Model
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required),
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    default: 'staff'
  },
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client by ID
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Safari Templates (Optional Starting Points)
- `GET /api/safari-templates` - Get all safari templates
- `POST /api/safari-templates` - Create new safari template
- `GET /api/safari-templates/[id]` - Get safari template by ID
- `PUT /api/safari-templates/[id]` - Update safari template
- `DELETE /api/safari-templates/[id]` - Delete safari template

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get booking by ID
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Delete booking
- `POST /api/bookings/[id]/confirm` - Confirm booking
- `POST /api/bookings/[id]/cancel` - Cancel booking

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice by ID
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `POST /api/invoices/[id]/send` - Send invoice
- `POST /api/invoices/[id]/mark-paid` - Mark as paid
- `POST /api/invoices/generate-from-booking` - Generate invoice from booking
- `GET /api/invoices/[id]/pdf` - Download PDF

### Financials
- `GET /api/financials` - Get financial summary
- `GET /api/financials/revenue` - Get revenue breakdown
- `GET /api/financials/currency` - Get currency breakdown

## Frontend Pages & Components

### Main Pages
1. **Dashboard** (`/`) - Overview with key metrics and charts
2. **Clients** (`/clients`) - Client management
3. **Safari Templates** (`/safari-templates`) - Optional template management
4. **Bookings** (`/bookings`) - Custom safari booking management
5. **Invoices** (`/invoices`) - Invoice management
6. **Financials** (`/financials`) - Financial reporting
7. **Settings** (`/settings`) - System settings

### Invoice Creation Pages
1. **Create Invoice** (`/invoices/new`) - Create new invoice
2. **Create from Booking** (`/invoices/new?booking=[id]`) - Create from existing booking
3. **Invoice Details** (`/invoices/[id]`) - View/edit invoice
4. **Invoice PDF** (`/invoices/[id]/pdf`) - PDF view

### Key Components
1. **InvoiceBuilder** - Custom invoice creation with itinerary builder
2. **ItineraryBuilder** - Day-by-day itinerary creation
3. **PricingCalculator** - Dynamic pricing calculation
4. **InclusionsExclusions** - Manage inclusions and exclusions
5. **ParticipantManager** - Manage passenger details
6. **PDFGenerator** - Generate branded PDF invoices

## Invoice Template Design

### Jungle Dwellers Branding
- **Primary Color**: Forest Green (#2d5016)
- **Secondary Color**: Earth Brown (#8b4513)
- **Accent Color**: Safari Gold (#d4af37)
- **Logo**: Jungle Dwellers logo with safari theme

### Invoice Structure
1. **Header**
   - Jungle Dwellers logo and branding
   - Invoice number and date
   - Client information

2. **Safari Details**
   - Safari name and duration
   - Travel dates
   - Participant list with details

3. **Itinerary Section**
   - Day-by-day breakdown
   - Activities, accommodation, meals
   - Transportation details

4. **Inclusions & Exclusions**
   - Detailed lists with categories
   - Clear formatting

5. **Pricing Breakdown**
   - Base price
   - Additional services
   - Discounts
   - Taxes
   - Total amount

6. **Payment Information**
   - Bank details
   - Payment terms
   - Due date

7. **Terms & Conditions**
   - Jungle Dwellers booking conditions
   - Contact information

## Workflow Process

### 1. Safari Creation (À La Carte)
**Step 1: Start Safari Creation**
- Choose to start from template (optional) or from scratch
- Enter basic safari details (name, duration, dates)

**Step 2: Build Custom Itinerary**
- Add days one by one (unlimited days)
- For each day, add:
  - Activities (unlimited per day)
  - Meals (unlimited per day)
  - Accommodation details
  - Transportation details
  - Notes and special instructions

**Step 3: Define Inclusions & Exclusions**
- Add inclusions (unlimited items with pricing)
- Add exclusions (unlimited items with reasons)
- Set pricing per item (per person or total)

**Step 4: Set Pricing**
- System calculates total cost automatically
- Review and adjust pricing
- Add discounts and taxes if needed

**Result**: Complete custom safari package ready for booking

### 2. Booking Creation
**Step 1: Select Client**
- Choose existing client or create new one
- Client details include passport, medical requirements, etc.

**Step 2: Select Safari**
- Choose from created custom safaris
- Safari details are copied to booking
- Can be modified for this specific booking

**Step 3: Add Participants**
- Add passenger details (name, age, passport, nationality)
- Add dietary and medical requirements
- Set total passenger count

**Step 4: Customize for This Booking**
- Modify itinerary if needed for this specific booking
- Adjust inclusions/exclusions if needed
- Update pricing if needed
- Add special requests

**Step 5: Confirm Booking**
- Review all details
- Set booking status (Pending, Confirmed, etc.)
- Generate booking number

**Result**: Complete booking ready for invoice generation

### 3. Invoice Generation
**Option A: Generate from Booking**
- Select existing booking
- All details copied from booking
- Can be modified for invoice
- Generate invoice number

**Option B: Create Independent Invoice**
- Start from scratch
- Add client details
- Build custom safari details
- Add custom itinerary
- Add custom inclusions/exclusions
- Set custom pricing

**Step 1: Invoice Details**
- Set invoice number and dates
- Add payment terms
- Set due date

**Step 2: Review & Generate**
- Review all details
- Generate PDF invoice
- Send to client

**Result**: Professional invoice ready for client

### Workflow Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SAFARI        │    │   BOOKING       │    │   INVOICE       │
│   CREATION      │───▶│   CREATION      │───▶│   GENERATION    │
│                 │    │                 │    │                 │
│ • Custom        │    │ • Select Client │    │ • From Booking  │
│   Itinerary     │    │ • Select Safari │    │ • Independent   │
│ • Inclusions    │    │ • Add Passengers│    │ • Generate PDF  │
│ • Exclusions    │    │ • Customize     │    │ • Send to Client│
│ • Pricing       │    │ • Confirm       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TEMPLATE      │    │   CLIENT        │    │   PAYMENT       │
│   (Optional)    │    │   MANAGEMENT    │    │   TRACKING      │
│                 │    │                 │    │                 │
│ • Base Template │    │ • Client Info   │    │ • Payment Status│
│ • Quick Start   │    │ • Passport      │    │ • Due Dates     │
│ • Suggestions   │    │ • Medical Info  │    │ • Reminders     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Points
1. **Safari First**: Always create the custom safari package first
2. **Booking Second**: Create booking from the safari (with client and passengers)
3. **Invoice Third**: Generate invoice from booking OR create independently
4. **Flexibility**: Each step can be customized and modified
5. **Templates**: Optional starting points to speed up safari creation

## PDF Generation System

### Technology Stack
- **HTML2PDF.js**: Client-side PDF generation library
- **HTML Templates**: Clean, professional invoice templates
- **CSS Styling**: Comprehensive styling with responsive design
- **JavaScript Engine**: Modular PDF generation system

### PDF Generation Features

#### A. Professional Design Quality
- **Clean Layout**: Professional invoice design with proper spacing
- **Consistent Branding**: Jungle Dwellers branding with green color scheme
- **Responsive Design**: Adapts to different content volumes
- **High-Quality Output**: 3x scale rendering for crisp PDFs

#### B. Advanced PDF Generation
- **Dynamic Content**: Service tables that adapt to different safari components
- **Smart Layout**: Compact mode for complex invoices
- **Page Break Control**: Prevents awkward page breaks
- **Multi-Currency Support**: USD, EUR, GBP, KES, CAD, AUD

#### C. Safari-Specific Service Tables
The system will have **custom service table types** for safari components:

1. **Accommodation** - Lodge/camp details, check-in/out dates, room types
2. **Activities** - Activity name, description, duration, pricing
3. **Transportation** - Vehicle type, routes, departure/arrival times
4. **Meals** - Meal types, locations, dietary requirements
5. **Park Fees** - Park entry fees, conservation fees, permits
6. **Guides** - Guide services, language, specializations

#### D. Template System
- **HTML Templates**: Clean, maintainable templates
- **Placeholder System**: `{{variableName}}` placeholders
- **Dynamic Styling**: CSS classes that adapt based on content
- **Jungle Dwellers Branding**: Custom colors, logo, and styling

### PDF Generation Architecture

#### Core Files Structure
```
jungledwellers/
├── templates/
│   ├── invoice.html          # Main invoice template
│   ├── booking.html          # Booking confirmation template
│   └── quotation.html        # Quotation template
├── modules/
│   ├── pdf-engine.js         # Main PDF generation engine
│   ├── pdf-utils.js          # PDF utility functions
│   └── safari-tables.js      # Safari-specific table rendering
└── styles/
    └── pdf-styles.css        # PDF-specific styling
```

#### Key Functions
- `generateInvoice()` - Generate invoice PDFs
- `generateBooking()` - Generate booking confirmations
- `generateQuotation()` - Generate quotations
- `renderSafariTables()` - Render safari-specific content
- `fillTemplate()` - Fill template placeholders

### Safari-Specific PDF Features

#### A. Dynamic Itinerary Display
- **Day-by-Day Breakdown**: Each day as a separate section
- **Activity Timeline**: Morning, afternoon, evening activities
- **Accommodation Details**: Lodge/camp information per night
- **Transportation**: Vehicle details and routes
- **Meal Information**: Breakfast, lunch, dinner details

#### B. Inclusions & Exclusions
- **Detailed Inclusions**: Comprehensive list of what's included
- **Clear Exclusions**: What's not included with reasons
- **Pricing Breakdown**: Per-person vs total pricing
- **Quantity Support**: Multiple items with quantities

#### C. Professional Styling
- **Jungle Dwellers Branding**: Green color scheme (#2d5016)
- **Safari Theme**: Nature-inspired design elements
- **Clean Typography**: Professional, readable fonts
- **Consistent Layout**: Uniform spacing and alignment

### PDF Generation Workflow

#### 1. Template Selection
- Choose appropriate template (invoice, booking, quotation)
- Load HTML template with CSS styling

#### 2. Data Population
- Fill template placeholders with safari data
- Render dynamic safari tables
- Apply appropriate styling based on content

#### 3. PDF Generation
- Convert HTML to PDF using HTML2PDF.js
- Apply page break controls
- Generate high-quality output

#### 4. Output Options
- **Preview Mode**: Show PDF in new window
- **Download Mode**: Direct PDF download
- **Email Mode**: Send PDF via email

### Quality Standards

#### A. Professional Output
- **Consistent Formatting**: All tables follow the same design pattern
- **Proper Spacing**: Well-balanced margins and padding
- **Typography**: Clean, readable fonts
- **Color Scheme**: Professional green and gray color palette

#### B. Technical Excellence
- **Modular Code**: Separate files for different functions
- **Error Handling**: Proper error handling and logging
- **Performance**: Efficient PDF generation
- **Browser Compatibility**: Works across different browsers

#### C. User Experience
- **Preview Mode**: Users can preview before downloading
- **Download Mode**: Direct PDF download
- **Responsive**: Adapts to different screen sizes
- **Fast Generation**: Quick PDF creation

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Next.js project with latest versions
- [ ] Configure MongoDB connection
- [ ] Set up authentication system
- [ ] Create basic database models
- [ ] Set up Tailwind CSS with Jungle Dwellers theme

### Phase 2: Core Models & API (Week 2)
- [ ] Implement all database models
- [ ] Create API routes for all entities
- [ ] Set up authentication middleware
- [ ] Create basic CRUD operations

### Phase 3: Invoice System (Week 3)
- [ ] Build invoice creation interface
- [ ] Implement itinerary builder
- [ ] Create inclusions/exclusions manager
- [ ] Build pricing calculator
- [ ] Set up HTML2PDF.js library
- [ ] Create PDF template system architecture
- [ ] Build core PDF generation engine
- [ ] Create invoice template with Jungle Dwellers branding
- [ ] Create booking confirmation template
- [ ] Create quotation template
- [ ] Implement safari-specific table rendering
- [ ] Add dynamic itinerary display
- [ ] Implement inclusions/exclusions sections
- [ ] Add multi-currency support
- [ ] Create PDF preview functionality
- [ ] Add PDF download functionality
- [ ] Implement page break controls
- [ ] Add responsive PDF styling
- [ ] Test PDF generation across browsers
- [ ] Optimize PDF generation performance

### Phase 4: Frontend Components (Week 4)
- [ ] Create dashboard with charts
- [ ] Build client management interface
- [ ] Create safari package management
- [ ] Build booking management system
- [ ] Implement financial reporting

### Phase 5: Testing & Polish (Week 5)
- [ ] Test all functionality
- [ ] Polish UI/UX
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Performance optimization

### Phase 6: Deployment (Week 6)
- [ ] Set up Vercel deployment
- [ ] Configure MongoDB Atlas
- [ ] Set up environment variables
- [ ] Deploy and test production

## Key Features

### 1. Flexible Invoice Creation
- Create invoices independently or from bookings
- Custom itinerary builder
- Dynamic pricing calculation
- Professional PDF generation

### 1.1. Dynamic Inclusions & Exclusions System
- **Unlimited Items**: Add as many inclusions/exclusions as needed for each safari
- **Categorized Items**: Organize by accommodation, transportation, meals, activities, services, insurance, other
- **Flexible Pricing**: Each inclusion can be priced per person or as total cost
- **Quantity Support**: Handle items like "2 nights accommodation" or "3 game drives"
- **Real-time Calculation**: Automatic cost calculation as items are added
- **Custom Descriptions**: Detailed descriptions for each item
- **Exclusion Reasons**: Optional reasons for why items are excluded

**Example Inclusions:**
- 2 nights accommodation at Masai Mara Serena Lodge ($200 per person per night)
- 3 game drives in 4x4 vehicle ($150 per person)
- All meals (breakfast, lunch, dinner) - included
- Park entry fees ($80 per person)
- Professional guide services ($100 per person)
- Airport transfers ($50 per person)

**Example Exclusions:**
- International flights (client to arrange)
- Travel insurance (client to arrange)
- Alcoholic beverages (available for purchase)
- Tips and gratuities (at client discretion)

### 1.2. Dynamic Itinerary System
- **Unlimited Days**: Add as many days as needed for each safari
- **Unlimited Activities**: Add as many activities per day as needed
- **Unlimited Meals**: Add as many meals per day as needed
- **Detailed Information**: Accommodation, transportation, timing, notes
- **Flexible Structure**: Each day can have different levels of detail
- **Real-time Updates**: Changes reflect immediately in pricing

**Example Itinerary:**
- **Day 1**: Arrival in Nairobi, city tour, dinner at Carnivore Restaurant
- **Day 2**: Flight to Masai Mara, game drive, lunch, evening game drive
- **Day 3**: Early morning game drive, breakfast, hot air balloon ride, lunch, afternoon game drive
- **Day 4**: Morning game drive, breakfast, flight to Nairobi, city shopping, dinner
- **Day 5**: Airport transfer, departure

**Each Day Can Include:**
- Multiple activities (unlimited)
- Multiple meals (unlimited)
- Detailed accommodation info
- Transportation details with timing
- Special instructions
- Weather information
- Notes and comments

### 2. À La Carte Safari System
- Every safari is completely custom-built
- Optional templates as starting points only
- **Unlimited dynamic inclusions/exclusions** - add as many as needed
- Detailed itinerary management
- Participant management
- Flexible pricing per item with quantity support
- Real-time cost calculation

### 3. Professional Branding
- Jungle Dwellers color scheme
- Safari-themed design elements
- Professional invoice templates
- Consistent branding throughout

### 4. Comprehensive Reporting
- Financial dashboards
- Revenue tracking
- Booking analytics
- Currency support

### 5. User Management
- Role-based access control
- Secure authentication
- User activity tracking
- Multi-user support

## Success Metrics

1. **Functionality**: All core features working as specified
2. **Performance**: Fast loading times and responsive UI
3. **Usability**: Intuitive interface for safari tour operations
4. **Reliability**: Stable system with proper error handling
5. **Scalability**: Can handle growing business needs

## Next Steps

1. Review and approve this specification
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular progress reviews and adjustments

---

**Document Version**: 1.0  
**Last Updated**: September 2025  
**Author**: Martin Konye  
**Status**: Draft for Review
