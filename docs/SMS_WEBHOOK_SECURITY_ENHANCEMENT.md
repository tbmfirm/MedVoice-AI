# SMS Webhook Security & Logging Enhancement - Complete ✅

## Overview

Enhanced the SMS webhook handler with comprehensive security features, logging, rate limiting, and spam detection to prevent abuse and provide full visibility into all incoming messages.

## What Was Implemented

### 1. Complete Message Logging ✅

**File:** `app/api/twilio/sms/webhook/route.ts`

- **All incoming SMS messages are now logged** to the database using the SMSLog model
- Logs include:
  - Phone number (sender)
  - Message content
  - Message type: "incoming"
  - Status: sent, processed, blocked, failed
  - Message SID from Twilio
  - Links to patient and organization (if found)
  - Error codes and messages for failures

### 2. Patient Verification ✅

**File:** `app/api/twilio/sms/webhook/route.ts`

- **Checks if sender is a known patient** before processing requests
- **CANCEL requests only work for known patients** - prevents unauthorized cancellations
- Different response messages for known vs unknown senders
- Unknown senders get restricted/generic responses

### 3. Rate Limiting ✅

**File:** `lib/utils/rate-limit.ts` (new)

- **In-memory rate limiting** (can be upgraded to Redis/database later)
- **Max 5 messages per phone number per hour**
- Automatic cleanup of old entries
- Returns remaining requests and reset time
- Prevents abuse and spam

### 4. Spam Detection ✅

**File:** `app/api/twilio/sms/webhook/route.ts`

- Detects suspicious patterns:
  - Very short messages from unknown senders (< 3 chars)
  - Only numbers
  - Repeated single character (e.g., "aaaaa")
  - Spam keywords
  - Very long messages from unknown senders (> 500 chars)
- **Spam messages are silently ignored** (no response sent)
- Spam attempts are logged with "blocked" status

### 5. Enhanced Response Logic ✅

**File:** `app/api/twilio/sms/webhook/route.ts`

The system now provides different responses based on context:

- **Known Patient + CANCEL:** Processes cancellation, sends confirmation
- **Known Patient + Other:** Friendly response with clinic phone number
- **Unknown Sender + CANCEL:** Informs they need to be a patient first
- **Unknown Sender + Other:** Generic response (no action taken)
- **Rate Limited:** Informs sender to wait before sending more messages
- **Spam:** Silent ignore (no response)

## Key Features

### Security Improvements

✅ **Rate Limiting:** Max 5 messages/hour per phone number  
✅ **Patient Verification:** Only known patients can cancel appointments  
✅ **Spam Detection:** Automatic detection and blocking of spam  
✅ **Message Logging:** Complete audit trail of all incoming messages  
✅ **Error Tracking:** All failures are logged with error codes  

### Response Messages

**Known Patient + CANCEL:**
```
"Your appointment has been cancelled. If you need to reschedule, please call us."
```

**Known Patient + Other:**
```
"Thank you for your message. For appointment cancellations, reply CANCEL. For other inquiries, please call us at [phone]."
```

**Unknown Sender + CANCEL:**
```
"We couldn't find an appointment associated with this number. Please call us to verify your information."
```

**Unknown Sender + Other:**
```
"This number is for appointment-related messages only. If you're a patient, please call us. For appointment cancellations, reply CANCEL."
```

**Rate Limited:**
```
"You've sent too many messages. Please wait before sending another message or call us for assistance."
```

**Spam:** (No response - silent ignore)

## Files Created

1. `lib/utils/rate-limit.ts` - Rate limiting utility with in-memory cache

## Files Updated

1. `app/api/twilio/sms/webhook/route.ts` - Complete rewrite with all security features
2. `prisma/schema.prisma` - Updated comments to include "incoming" message type and "processed"/"blocked" statuses

## Database Schema

The existing SMSLog model supports all features:
- `messageType`: Can be "incoming" for incoming messages
- `status`: Can be "sent", "processed", "blocked", "failed", "delivered", "undelivered"
- `errorCode`: Stores error codes like "RATE_LIMIT_EXCEEDED", "SPAM_DETECTED", "UNKNOWN_PATIENT", "NO_APPOINTMENT"
- `errorMessage`: Stores descriptive error messages

## Rate Limiting Implementation

- **Storage:** In-memory Map (simple, fast, works for single server)
- **Window:** 1 hour rolling window
- **Limit:** 5 messages per phone number per hour
- **Cleanup:** Automatic cleanup every 10 minutes
- **Upgrade Path:** Can be upgraded to Redis or database for distributed systems

## Spam Detection Rules

1. **Very short messages** (< 3 chars) from unknown senders
2. **Only numbers** (e.g., "12345")
3. **Repeated characters** (e.g., "aaaaa")
4. **Spam keywords** (spam, advertisement, promo)
5. **Very long messages** (> 500 chars) from unknown senders

## Testing Scenarios

### ✅ Test Cases Covered

1. **Known Patient + CANCEL:** ✅ Processes cancellation
2. **Known Patient + Other:** ✅ Sends friendly response
3. **Unknown Sender + CANCEL:** ✅ Informs they need to be patient
4. **Unknown Sender + Other:** ✅ Sends generic response
5. **Rate Limiting:** ✅ Blocks after 5 messages/hour
6. **Spam Detection:** ✅ Silently ignores spam
7. **Message Logging:** ✅ All messages logged to database

## Security Benefits

1. **Prevents Abuse:** Rate limiting stops spam/abuse
2. **Prevents Unauthorized Cancellations:** Only known patients can cancel
3. **Complete Audit Trail:** All messages logged for compliance
4. **Spam Protection:** Automatic detection and blocking
5. **Error Tracking:** All failures logged for debugging

## Monitoring & Debugging

### View All Incoming Messages

```sql
SELECT * FROM sms_logs 
WHERE message_type = 'incoming' 
ORDER BY sent_at DESC 
LIMIT 50;
```

### View Rate Limited Messages

```sql
SELECT * FROM sms_logs 
WHERE error_code = 'RATE_LIMIT_EXCEEDED' 
ORDER BY sent_at DESC;
```

### View Spam Attempts

```sql
SELECT * FROM sms_logs 
WHERE error_code = 'SPAM_DETECTED' 
ORDER BY sent_at DESC;
```

### View Failed Messages

```sql
SELECT * FROM sms_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC;
```

## Performance Considerations

- **In-memory rate limiting** is very fast (O(1) lookups)
- **Database logging** is async and doesn't block responses
- **Spam detection** uses simple regex patterns (fast)
- **Patient lookup** is indexed (fast database query)

## Future Enhancements

Potential improvements for later:
1. Upgrade rate limiting to Redis for distributed systems
2. Machine learning-based spam detection
3. Whitelist/blacklist for phone numbers
4. Admin dashboard to view SMS logs
5. SMS conversation threading
6. Automated responses for common questions

## Success Criteria

✅ All incoming SMS messages are logged  
✅ Only known patients can cancel appointments  
✅ Rate limiting prevents abuse (max 5/hour)  
✅ Spam messages are detected and handled  
✅ Appropriate responses for all scenarios  
✅ No unauthorized appointment cancellations  
✅ Complete audit trail for compliance  

## Notes

- Rate limiting uses in-memory cache (resets on server restart)
- Spam detection is basic but effective for MVP
- All messages are logged even if processing fails
- Unknown senders can still send CANCEL but won't cancel anything
- System is designed to be secure by default
