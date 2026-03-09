---
name: TBM Systems Phase 1 MVP
overview: Build a complete AI-powered patient access system with voice call handling, smart transfers, SMS confirmations, online booking, and admin dashboard. Architecture uses Twilio for telephony, OpenAI Realtime API (modular) for AI, PostgreSQL with Prisma, and NextAuth for admin authentication.
todos:
  - id: db-setup
    content: Set up PostgreSQL database with Prisma ORM. Create schema for clinics, locations, doctors, appointments, call_logs, users, and clinic_settings tables
    status: pending
  - id: twilio-integration
    content: Integrate Twilio for voice calls, SMS, and call transfers. Create webhook handlers for inbound calls and SMS
    status: pending
    dependencies:
      - db-setup
  - id: ai-provider-modular
    content: Build modular AI provider system with OpenAI Realtime API as default. Create base interface and OpenAI implementation
    status: pending
    dependencies:
      - db-setup
  - id: voice-call-handling
    content: Implement intelligent call handling with intent detection (book/cancel/reschedule/general/transfer) and conversation flow
    status: pending
    dependencies:
      - twilio-integration
      - ai-provider-modular
  - id: smart-transfer
    content: Build smart call transfer system with working hours detection, transfer routing, and comprehensive logging
    status: pending
    dependencies:
      - twilio-integration
      - voice-call-handling
  - id: sms-confirmation
    content: Implement detailed SMS confirmation system with all required fields and CANCEL reply handling
    status: pending
    dependencies:
      - twilio-integration
      - db-setup
  - id: google-calendar
    content: Integrate Google Calendar API for real-time availability checking and appointment creation
    status: pending
    dependencies:
      - db-setup
  - id: online-booking
    content: Build public online booking system with clinic-specific pages, real-time availability, and booking form
    status: pending
    dependencies:
      - google-calendar
      - sms-confirmation
  - id: admin-dashboard
    content: Create admin dashboard with NextAuth authentication, call logs view, appointments management, and clinic settings
    status: pending
    dependencies:
      - db-setup
  - id: onboarding-flow
    content: Build onboarding wizard for adding new clinics with all required setup steps (locations, doctors, calendar, Twilio, booking page)
    status: pending
    dependencies:
      - admin-dashboard
      - online-booking
---

# TBM Systems Phase 1 MVP Implementation Plan

## Architecture Overview

**Tech Stack:**

- **Frontend/Backend:** Next.js 16 (App Router) with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Telephony:** Twilio (calls, SMS, transfers)
- **AI/LLM:** OpenAI Realtime API (default, modular design)
- **Auth:** NextAuth.js for admin dashboard
- **Calendar:** Google Calendar API integration
- **Hosting:** Vercel (Next.js) + separate database hosting

## System Architecture

```
┌─────────────────┐
│  Patient Calls  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Twilio Voice   │────▶│  OpenAI Realtime │
│  (Telephony)    │     │  API (Modular)   │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Intent Handler │
│  (Book/Cancel/  │
│   Transfer/etc) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Booking │ │ Transfer │
│System  │ │  Logic   │
└───┬────┘ └────┬─────┘
    │           │
    ▼           ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  (Prisma ORM)   │
└─────────────────┘
```

## Implementation Phases

### Phase 1: Database & Core Infrastructure

**Files to create:**

- `prisma/schema.prisma` - Database schema
- `lib/db.ts` - Prisma client initialization
- `.env.example` - Environment variables template

**Database Schema:**

- `clinics` - Clinic information
- `locations` - Physical locations per clinic
- `doctors` - Doctor profiles
- `appointments` - All appointments (voice + web)
- `call_logs` - Complete call history with transfer data
- `users` - Admin users (NextAuth)
- `clinic_settings` - Booking configuration per clinic

**Key Tables:**

```prisma
model CallLog {
  id                  String   @id @default(cuid())
  clinicId            String
  callerNumber        String
  intent              String?  // book, cancel, reschedule, general, transfer
  transferred         Boolean  @default(false)
  transferTarget      String?
  transferAnswered    Boolean?
  transferDuration    Int?     // seconds
  totalCallDuration   Int       // seconds
  transcript          String?
  recordingUrl         String?
  createdAt           DateTime @default(now())
  clinic              Clinic   @relation(fields: [clinicId], references: [id])
}

model Appointment {
  id          String   @id @default(cuid())
  clinicId    String
  doctorId    String
  locationId  String
  patientName String
  patientPhone String
  patientEmail String?
  source      String   // "voice" | "web"
  status      String   // "confirmed" | "cancelled" | "completed"
  dateTime    DateTime
  createdAt   DateTime @default(now())
  clinic      Clinic   @relation(fields: [clinicId], references: [id])
  doctor      Doctor   @relation(fields: [doctorId], references: [id])
  location    Location @relation(fields: [locationId], references: [id])
}
```

### Phase 2: Twilio Integration & Voice System

**Files to create:**

- `app/api/twilio/voice/incoming/route.ts` - Inbound call handler
- `app/api/twilio/voice/status/route.ts` - Call status webhook
- `app/api/twilio/sms/webhook/route.ts` - SMS webhook (CANCEL replies)
- `lib/twilio/client.ts` - Twilio client setup
- `lib/twilio/transfer.ts` - Call transfer logic
- `lib/ai/providers/base.ts` - Base AI provider interface
- `lib/ai/providers/openai.ts` - OpenAI Realtime API implementation
- `lib/ai/intent-detector.ts` - Intent classification
- `lib/ai/call-handler.ts` - Main call orchestration

**Key Features:**

1. **Inbound Call Flow:**

   - Twilio webhook receives call
   - Streams audio to OpenAI Realtime API
   - Detects intent (book/cancel/reschedule/general/transfer)
   - Handles conversation flow
   - Logs entire interaction

2. **Smart Transfer Logic:**

   - Detects transfer triggers (keywords, low confidence, complex questions)
   - Checks working hours
   - Transfers to clinic line (working hours) or offers voicemail/callback (off-hours)
   - Tracks transfer duration and outcome

3. **Modular AI Provider:**
   ```typescript
   interface AIProvider {
     handleConversation(audioStream, context): Promise<ConversationResult>
     detectIntent(transcript): Promise<Intent>
   }
   ```


   - Default: OpenAI implementation
   - Easy to add: Claude, Gemini, etc.

### Phase 3: SMS Confirmation System

**Files to create:**

- `lib/sms/sender.ts` - SMS sending service
- `lib/sms/templates.ts` - SMS message templates
- `app/api/appointments/[id]/sms/route.ts` - Trigger SMS endpoint

**SMS Template:**

```
Your appointment at {clinicName} is confirmed.
Doctor: {doctorName}
Location: {locationName}
Address: {fullAddress}
Date: {date} at {time}
Reply CANCEL to cancel.
```

**Features:**

- Sends within 10 seconds of booking
- Includes all required fields
- Handles CANCEL replies via webhook
- Logs SMS delivery status

### Phase 4: Online Booking System

**Files to create:**

- `app/booking/[clinicSlug]/page.tsx` - Public booking page
- `app/api/booking/availability/route.ts` - Real-time availability check
- `app/api/booking/create/route.ts` - Create booking endpoint
- `lib/calendar/google.ts` - Google Calendar integration
- `lib/booking/availability.ts` - Availability calculation logic
- `components/booking/BookingForm.tsx` - Booking form component
- `components/booking/TimeSlotSelector.tsx` - Time selection component

**Booking Flow:**

1. Patient visits `/booking/[clinic-slug]`
2. Selects location → doctor → date → time
3. Enters name, phone, email
4. System checks Google Calendar availability
5. Creates appointment
6. Sends SMS confirmation
7. Logs in database

**Admin Controls:**

- Enable/disable online booking per clinic
- Set booking window (e.g., no same-day)
- Set buffer time between appointments
- Block specific dates
- Custom instructions

### Phase 5: Google Calendar Integration

**Files to create:**

- `lib/calendar/google.ts` - Google Calendar API client
- `lib/calendar/sync.ts` - Bi-directional sync logic
- `app/api/calendar/sync/route.ts` - Sync endpoint
- `app/api/calendar/webhook/route.ts` - Calendar webhook handler

**Features:**

- Create appointments in Google Calendar
- Check real-time availability
- Handle calendar updates (reschedules, cancellations)
- Prevent double-booking

### Phase 6: Admin Dashboard

**Files to create:**

- `app/admin/layout.tsx` - Admin layout with auth
- `app/admin/dashboard/page.tsx` - Main dashboard
- `app/admin/calls/page.tsx` - Call logs view
- `app/admin/appointments/page.tsx` - Appointments management
- `app/admin/clinics/page.tsx` - Clinic management
- `app/admin/clinics/[id]/settings/page.tsx` - Clinic settings
- `components/admin/CallLogTable.tsx` - Call logs table with filters
- `components/admin/AppointmentTable.tsx` - Appointments table
- `lib/auth/config.ts` - NextAuth configuration

**Dashboard Features:**

- View all call logs (filterable, exportable)
- View all appointments
- Transfer status tracking
- SMS delivery status
- Clinic configuration
- Booking page settings
- Analytics/metrics

### Phase 7: Onboarding Flow

**Files to create:**

- `app/admin/onboarding/page.tsx` - Onboarding wizard
- `app/api/onboarding/clinic/route.ts` - Create clinic endpoint
- `lib/onboarding/generator.ts` - Booking page generator
- `lib/onboarding/twilio-setup.ts` - Twilio number assignment

**Onboarding Steps:**

1. Create clinic profile
2. Add locations
3. Add doctors
4. Connect Google Calendar
5. Assign Twilio number
6. Configure transfer number
7. Generate booking page
8. Test voice + web booking
9. Go live

## Key Implementation Details

### Modular AI Provider Pattern

```typescript
// lib/ai/providers/base.ts
export interface AIProvider {
  handleCall(audioStream: Stream, context: CallContext): Promise<CallResult>
  detectIntent(transcript: string): Promise<Intent>
}

// lib/ai/providers/openai.ts
export class OpenAIProvider implements AIProvider { ... }

// lib/ai/factory.ts
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai'
  switch(provider) {
    case 'openai': return new OpenAIProvider()
    case 'claude': return new ClaudeProvider() // Future
    default: return new OpenAIProvider()
  }
}
```

### Call Transfer Logic

```typescript
// lib/twilio/transfer.ts
export async function handleTransfer(
  callSid: string,
  clinic: Clinic,
  reason: TransferReason
): Promise<TransferResult> {
  const isWorkingHours = checkWorkingHours(clinic)
  
  if (isWorkingHours) {
    return await transferToClinic(callSid, clinic.transferNumber)
  } else {
    return await offerVoicemailOrCallback(callSid, clinic)
  }
}
```

### Database Migrations

- Use Prisma migrations for schema changes
- Seed script for initial admin user
- Migration for adding new fields to existing tables

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Twilio
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# OpenAI
OPENAI_API_KEY="..."
AI_PROVIDER="openai" # Modular: can switch to "claude", etc.

# NextAuth
NEXTAUTH_URL="..."
NEXTAUTH_SECRET="..."

# Google Calendar
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="..."

# SMS
TWILIO_SMS_FROM="..."
```

## Testing Strategy

1. **Voice System:**

   - Test intent detection accuracy
   - Test transfer scenarios
   - Test booking flow end-to-end

2. **Online Booking:**

   - Test availability calculation
   - Test double-booking prevention
   - Test SMS confirmation delivery

3. **Integration:**

   - Test Google Calendar sync
   - Test Twilio webhooks
   - Test transfer success rate

## Performance Benchmarks

- 90%+ voice bookings succeed
- 0 double bookings
- Transfer success rate > 95%
- SMS delivery > 95%
- Online booking works across 10 clinics
- Onboarding under 1 hour

## File Structure

```
 `├── app/
│   ├── api/
│   │   ├── twilio/
│   │   │   ├── voice/
│   │   │   │   ├── incoming/route.ts
│   │   │   │   └── status/route.ts
│   │   │   └── sms/webhook/route.ts
│   │   ├── booking/
│   │   │   ├── availability/route.ts
│   │   │   └── create/route.ts
│   │   ├── appointments/[id]/sms/route.ts
│   │   └── calendar/sync/route.ts
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── calls/page.tsx
│   │   ├── appointments/page.tsx
│   │   └── clinics/[id]/settings/page.tsx
│   ├── booking/[clinicSlug]/page.tsx
│   └── api/auth/[...nextauth]/route.ts
├── lib/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── base.ts
│   │   │   └── openai.ts
│   │   ├── intent-detector.ts
│   │   └── call-handler.ts
│   ├── twilio/
│   │   ├── client.ts
│   │   └── transfer.ts
│   ├── sms/
│   │   ├── sender.ts
│   │   └── templates.ts
│   ├── calendar/
│   │   ├── google.ts
│   │   └── sync.ts
│   ├── booking/
│   │   └── availability.ts
│   ├── onboarding/
│   │   ├── generator.ts
│   │   └── twilio-setup.ts
│   └── db.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── components/
    ├── admin/
    │   ├── CallLogTable.tsx
    │   └── AppointmentTable.tsx
    └── booking/
        ├── BookingForm.tsx
        └── TimeSlotSelector.tsx
```

## Success Criteria

Phase 1 is shipped when:

- ✅ 3 paying clinics live
- ✅ Voice working (intent detection, booking, confirmation)
- ✅ Transfer working (smart routing, logging)
- ✅ SMS confirmation detailed (all fields, CANCEL reply)
- ✅ Web booking live (real-time availability, no double-booking)
- ✅ Dashboard live (call logs, appointments, settings)
- ✅ Logs stored in DB (all interactions, transfers)
- ✅ Onboarding repeatable (under 1 hour, no developer needed)