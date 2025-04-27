import { gapi } from 'gapi-script';

// Your Google OAuth credentials
// You'll need to obtain these from Google Cloud Console
const CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID';
const API_KEY = 'YOUR_GOOGLE_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

class GoogleCalendarService {
  private isInitialized = false;
  private isSignedIn = false;

  /**
   * Initialize the Google API client
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise<void>((resolve, reject) => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          });

          // Listen for sign-in state changes
          gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));

          // Handle the initial sign-in state
          this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Update the sign-in status
   */
  private updateSigninStatus(isSignedIn: boolean): void {
    this.isSignedIn = isSignedIn;
  }

  /**
   * Sign in the user
   */
  async signIn(): Promise<void> {
    if (!this.isInitialized) await this.init();
    
    try {
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  }

  /**
   * Sign out the user
   */
  async signOut(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      await gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
      console.error('Error signing out from Google', error);
      throw error;
    }
  }

  /**
   * Check if user is signed in
   */
  isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: {
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    attendees?: Array<{ email: string }>;
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
  }): Promise<any> {
    if (!this.isInitialized) await this.init();
    if (!this.isSignedIn) await this.signIn();

    const calendarEvent = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: event.attendees,
      reminders: event.reminders || {
        useDefault: true,
      },
    };

    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
      });
      
      return response.result;
    } catch (error) {
      console.error('Error creating Google Calendar event', error);
      throw error;
    }
  }

  /**
   * Get user's calendar events for a date range
   */
  async getEvents(
    timeMin: Date,
    timeMax: Date
  ): Promise<any[]> {
    if (!this.isInitialized) await this.init();
    if (!this.isSignedIn) await this.signIn();

    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events', error);
      throw error;
    }
  }

  /**
   * Create a leave request event
   */
  async createLeaveEvent(
    title: string,
    startDate: Date,
    endDate: Date,
    description: string = ''
  ): Promise<any> {
    return this.createEvent({
      summary: `Leave: ${title}`,
      description,
      start: startDate,
      end: endDate,
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 1440 }], // Reminder 1 day before
      },
    });
  }

  /**
   * Sync system holidays to user's calendar
   */
  async syncHolidays(holidays: Array<{
    name: string;
    date: string;
    type: string;
  }>): Promise<any[]> {
    if (!this.isInitialized) await this.init();
    if (!this.isSignedIn) await this.signIn();

    const results = [];

    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.date);
      const nextDay = new Date(holidayDate);
      nextDay.setDate(holidayDate.getDate() + 1);

      const event = {
        summary: `Holiday: ${holiday.name}`,
        description: `${holiday.type} holiday`,
        start: {
          date: holiday.date, // Use date-only for all-day events
        },
        end: {
          date: nextDay.toISOString().split('T')[0], // Next day for all-day event
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 1440 }], // Reminder 1 day before
        },
      };

      try {
        const response = await gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });
        
        results.push(response.result);
      } catch (error) {
        console.error(`Error syncing holiday ${holiday.name}`, error);
      }
    }

    return results;
  }

  /**
   * Sync work schedules to user's calendar
   */
  async syncWorkSchedule(
    schedules: Array<{
      day: string;
      date: string;
      startTime: string;
      endTime: string;
      description?: string;
    }>
  ): Promise<any[]> {
    if (!this.isInitialized) await this.init();
    if (!this.isSignedIn) await this.signIn();

    const results = [];

    for (const schedule of schedules) {
      // Parse date and times
      const [year, month, day] = schedule.date.split('-').map(Number);
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);

      const event = {
        summary: `Work Schedule: ${schedule.day}`,
        description: schedule.description || 'Regular work hours',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 60 }], // Reminder 1 hour before
        },
      };

      try {
        const response = await gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });
        
        results.push(response.result);
      } catch (error) {
        console.error(`Error syncing schedule for ${schedule.day}`, error);
      }
    }

    return results;
  }
}

export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService; 