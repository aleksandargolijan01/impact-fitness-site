import { Injectable } from '@angular/core';
import { bookingEmailConfig } from './booking-email.config';

export interface BookingEmailPayload {
  fullName: string;
  phone: string;
  email: string;
  goal: string;
  serviceType: string;
  trainerId: string;
  trainerName: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingEmailService {
  async sendBookingRequest(payload: BookingEmailPayload): Promise<void> {
    this.assertConfigured();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const sanitizedPayload = this.sanitizePayload(payload);

    try {
      const response = await fetch(bookingEmailConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          service_id: bookingEmailConfig.serviceId,
          template_id: bookingEmailConfig.templateId,
          user_id: bookingEmailConfig.publicKey,
          template_params: {
            full_name: sanitizedPayload.fullName,
            phone: sanitizedPayload.phone,
            email: sanitizedPayload.email,
            goal: sanitizedPayload.goal,
            service_type: sanitizedPayload.serviceType,
            trainer_name: sanitizedPayload.trainerName,
            message: sanitizedPayload.message || 'Nema dodatne poruke.',
            submitted_at: new Date().toLocaleString('sr-RS'),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Email service returned an error.');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private assertConfigured(): void {
    const missingConfig = [
      bookingEmailConfig.serviceId,
      bookingEmailConfig.templateId,
      bookingEmailConfig.publicKey,
    ].some((value) => value.startsWith('YOUR_EMAILJS_'));

    if (missingConfig) {
      throw new Error('EmailJS configuration is missing.');
    }
  }

  private sanitizePayload(payload: BookingEmailPayload): BookingEmailPayload {
    return {
      fullName: this.cleanInput(payload.fullName),
      phone: this.cleanInput(payload.phone),
      email: this.cleanInput(payload.email).toLowerCase(),
      goal: this.cleanInput(payload.goal),
      serviceType: this.cleanInput(payload.serviceType),
      trainerId: this.cleanInput(payload.trainerId),
      trainerName: this.cleanInput(payload.trainerName),
      message: this.cleanInput(payload.message),
    };
  }

  private cleanInput(value: string): string {
    return value
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
