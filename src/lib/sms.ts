/**
 * SMS Service using Twilio
 * Handles receipt delivery, follow-ups, and appointment reminders
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!accountSid || !authToken) {
    console.warn('⚠️ Twilio credentials not configured');
    return null;
  }
  
  if (!client) {
    client = twilio(accountSid, authToken);
  }
  
  return client;
}

export interface ReceiptData {
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  storeName: string;
  storeHandle: string;
  orderNumber: string;
  date: Date;
}

/**
 * Send SMS receipt after purchase
 */
export async function sendReceipt(data: ReceiptData): Promise<boolean> {
  const twilioClient = getTwilioClient();
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('📱 SMS disabled - would send receipt to:', data.customerPhone);
    return false;
  }

  try {
    const itemsList = data.items
      .map(item => `${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
      .join('\n');

    const message = `
🧾 Receipt from ${data.storeName}

${itemsList}

Total: $${data.total.toFixed(2)}

Order #${data.orderNumber}
${new Date(data.date).toLocaleDateString()}

Thank you for your purchase! 💚

View order: ${process.env.NEXT_PUBLIC_APP_URL}/u/${data.storeHandle}
`.trim();

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.customerPhone,
    });

    console.log('✅ SMS receipt sent to:', data.customerPhone);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS receipt:', error);
    return false;
  }
}

/**
 * Send booking confirmation
 */
export async function sendBookingConfirmation(data: {
  customerPhone: string;
  customerName: string;
  storeName: string;
  storeHandle: string;
  service: string;
  date: Date;
  bookingId: string;
}): Promise<boolean> {
  const twilioClient = getTwilioClient();
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('📱 SMS disabled - would send booking confirmation to:', data.customerPhone);
    return false;
  }

  try {
    const formattedDate = new Date(data.date).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = `
✅ Booking Confirmed!

${data.service} with ${data.storeName}
${formattedDate}

Booking #${data.bookingId}

See you soon, ${data.customerName}! 💚

View/reschedule: ${process.env.NEXT_PUBLIC_APP_URL}/u/${data.storeHandle}
`.trim();

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.customerPhone,
    });

    console.log('✅ SMS booking confirmation sent to:', data.customerPhone);
    return true;
  } catch (error) {
    console.error('❌ Failed to send booking confirmation:', error);
    return false;
  }
}

/**
 * Send appointment reminder (24 hours before)
 */
export async function sendAppointmentReminder(data: {
  customerPhone: string;
  customerName: string;
  storeName: string;
  storeHandle: string;
  service: string;
  date: Date;
}): Promise<boolean> {
  const twilioClient = getTwilioClient();
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('📱 SMS disabled - would send reminder to:', data.customerPhone);
    return false;
  }

  try {
    const formattedTime = new Date(data.date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = `
⏰ Reminder: Tomorrow at ${formattedTime}

${data.service} with ${data.storeName}

See you soon, ${data.customerName}!

Need to reschedule? ${process.env.NEXT_PUBLIC_APP_URL}/u/${data.storeHandle}
`.trim();

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.customerPhone,
    });

    console.log('✅ SMS reminder sent to:', data.customerPhone);
    return true;
  } catch (error) {
    console.error('❌ Failed to send reminder:', error);
    return false;
  }
}

/**
 * Send follow-up message to encourage repeat business
 */
export async function sendFollowUp(data: {
  customerPhone: string;
  customerName: string;
  storeName: string;
  storeHandle: string;
  lastPurchase: string;
}): Promise<boolean> {
  const twilioClient = getTwilioClient();
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('📱 SMS disabled - would send follow-up to:', data.customerPhone);
    return false;
  }

  try {
    const message = `
Hey ${data.customerName}! 👋

Hope you loved your ${data.lastPurchase} from ${data.storeName}!

Ready to book again?
${process.env.NEXT_PUBLIC_APP_URL}/u/${data.storeHandle}

- ${data.storeName}
`.trim();

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.customerPhone,
    });

    console.log('✅ SMS follow-up sent to:', data.customerPhone);
    return true;
  } catch (error) {
    console.error('❌ Failed to send follow-up:', error);
    return false;
  }
}

/**
 * Format phone number to E.164 format (required by Twilio)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add +1 for US numbers if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Add + if not present
  if (!phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Basic validation: starts with + and has 10-15 digits
  return /^\+\d{10,15}$/.test(formatted);
}
