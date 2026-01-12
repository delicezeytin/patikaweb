import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCalendarEvent = async (
    request: {
        date: string; // YYYY-MM-DD
        time: string; // HH:MM
        parentName: string;
        studentName: string;
        email: string;
        className?: string;
    }
): Promise<{ success: boolean; eventLink?: string; error?: any }> => {
    try {
        const settings = await prisma.systemSettings.findFirst();

        // 1. Check if Calendar Config exists
        if (!settings || !settings.calendarId || !settings.googleServiceAccountJson) {
            console.log('Calendar settings missing. Skipping event creation.');
            return { success: false, error: 'Takvim ayarları eksik' };
        }

        // 2. Parse Credentials
        let credentials;
        try {
            credentials = JSON.parse(settings.googleServiceAccountJson);
        } catch (e) {
            console.error('Invalid Google Credentials JSON');
            return { success: false, error: 'Geçersiz Google Kimlik Bilgileri' };
        }

        // 3. Authenticate
        // 3. Authenticate
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: credentials.client_email,
                private_key: credentials.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const authClient = await auth.getClient();

        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // 4. Prepare Event Data
        // Parse start datetime
        // Time is like "09:00" or "09:30". Convert to ISO format with Timezone.
        // Assuming settings.timezone or default Europe/Istanbul
        const timeZone = settings.timezone || 'Europe/Istanbul';

        // Construct ISO string: "2023-12-25T09:00:00"
        const startDateTimeStr = `${request.date}T${request.time}:00`;
        // We need end time. Assuming 20 mins duration default or passed?
        // Since we don't have duration passed here easily without querying form again,
        // let's assume 30 mins or query form.
        // For simplicity, let's look at start time + 30 mins.

        const startDate = new Date(startDateTimeStr);
        const endDate = new Date(startDate.getTime() + 30 * 60000); // +30 mins

        // Format for Google: "2023-12-25T09:00:00" (Local time)
        // If we provide timeZone field, Google treats dateTime as local time in that zone.

        const event = {
            summary: `Veli Toplantısı: ${request.studentName} (${request.parentName})`,
            description: `Veli: ${request.parentName}\nÖğrenci: ${request.studentName}\nSınıf: ${request.className || '-'}\nİletişim: ${request.email}\n\nBu etkinlik Patika Yuva Randevu Sistemi tarafından otomatik oluşturulmuştur.`,
            start: {
                dateTime: startDateTimeStr,
                timeZone: timeZone,
            },
            end: {
                dateTime: endDate.toISOString().split('.')[0], // Simple ISO format
                timeZone: timeZone,
            },
            attendees: [
                { email: request.email }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 },
                ],
            },
        };

        // 5. Insert Event
        const res = await calendar.events.insert({
            calendarId: settings.calendarId,
            requestBody: event,
            sendUpdates: 'all', // Sends email to attendees
        });

        console.log('Calendar event created:', res.data.htmlLink);

        return { success: true, eventLink: res.data.htmlLink || undefined };

    } catch (error) {
        console.error('Calendar event creation failed:', error);
        return { success: false, error };
    }
};
