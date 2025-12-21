import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, specialty, callVolume, practiceName, message } = body;

    // Trim and validate required fields
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim();

    if (!trimmedName || !trimmedEmail) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Determine which form was used and format the email accordingly
    let emailSubject = `New Contact Form Submission - ${trimmedName}`;
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">New Contact Form Submission</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 10px 0;"><strong style="color: #4F46E5;">Name:</strong> <span style="color: #333;">${trimmedName}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #4F46E5;">Email:</strong> <span style="color: #333;">${trimmedEmail}</span></p>
    `;

    if (specialty?.trim()) {
      emailContent += `<p style="margin: 10px 0;"><strong style="color: #4F46E5;">Practice Specialty:</strong> <span style="color: #333;">${specialty.trim()}</span></p>`;
    }
    if (practiceName?.trim()) {
      emailContent += `<p style="margin: 10px 0;"><strong style="color: #4F46E5;">Practice Name:</strong> <span style="color: #333;">${practiceName.trim()}</span></p>`;
    }
    if (callVolume?.trim()) {
      emailContent += `<p style="margin: 10px 0;"><strong style="color: #4F46E5;">Call Volume:</strong> <span style="color: #333;">${callVolume.trim()}</span></p>`;
    }
    if (message?.trim()) {
      emailContent += `<p style="margin: 10px 0;"><strong style="color: #4F46E5;">Message:</strong> <span style="color: #333;">${message.trim()}</span></p>`;
    }

    emailContent += `
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This email was sent from the MedVoice AI contact form.</p>
      </div>
    `;

    // Create plain text version for email clients that don't support HTML
    const textContent = `
New Contact Form Submission

Name: ${trimmedName}
Email: ${trimmedEmail}
${specialty?.trim() ? `Practice Specialty: ${specialty.trim()}\n` : ''}${practiceName?.trim() ? `Practice Name: ${practiceName.trim()}\n` : ''}${callVolume?.trim() ? `Call Volume: ${callVolume.trim()}\n` : ''}${message?.trim() ? `Message: ${message.trim()}\n` : ''}
This email was sent from the MedVoice AI contact form.
    `.trim();

    // Send email using Resend
    // Note: Update 'from' email with your verified domain in Resend
    // Note: Update 'to' email with your actual receiving email address
    const { data, error } = await resend.emails.send({
      from: 'MedVoice AI <onboarding@resend.dev>', // Update this with your verified domain
      to: ['masterawahab@gmail.com'],
      subject: emailSubject,
      html: emailContent,
      text: textContent,
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error, null, 2));
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');

      // Extract a user-friendly error message
      let errorMessage = 'Failed to send email. Please try again.';

      // Resend error can be an object with message property or a string
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Check various possible error message locations
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('error' in error) {
          const errorValue = (error as any).error;
          errorMessage =
            typeof errorValue === 'string'
              ? errorValue
              : JSON.stringify(errorValue);
        } else if ('name' in error && typeof error.name === 'string') {
          errorMessage = error.name;
        }
      }

      // Filter out "Message is required" if it's not relevant to our form
      if (
        errorMessage.toLowerCase().includes('message is required') &&
        !message
      ) {
        errorMessage =
          'Failed to send email. Please check your information and try again.';
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

