import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import googleCalendarService from '../services/GoogleCalendarService';

interface GoogleCalendarContextType {
  isInitialized: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createEvent: (event: any) => Promise<any>;
  getEvents: (timeMin: Date, timeMax: Date) => Promise<any[]>;
  createLeaveEvent: (title: string, startDate: Date, endDate: Date, description?: string) => Promise<any>;
  syncHolidays: (holidays: any[]) => Promise<any[]>;
  syncWorkSchedule: (schedules: any[]) => Promise<any[]>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export const useGoogleCalendar = (): GoogleCalendarContextType => {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error('useGoogleCalendar must be used within a GoogleCalendarProvider');
  }
  return context;
};

export const GoogleCalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to initialize on mount if auto-initialization is desired
    // initialize();
  }, []);

  const initialize = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleCalendarService.init();
      setIsInitialized(true);
      setIsSignedIn(googleCalendarService.isUserSignedIn());
    } catch (err: any) {
      console.error('Failed to initialize Google Calendar', err);
      setError(err.message || 'Failed to initialize Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleCalendarService.signIn();
      setIsSignedIn(true);
    } catch (err: any) {
      console.error('Failed to sign in with Google', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleCalendarService.signOut();
      setIsSignedIn(false);
    } catch (err: any) {
      console.error('Failed to sign out from Google', err);
      setError(err.message || 'Failed to sign out from Google');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (event: any): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await googleCalendarService.createEvent(event);
      return result;
    } catch (err: any) {
      console.error('Failed to create event', err);
      setError(err.message || 'Failed to create event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getEvents = async (timeMin: Date, timeMax: Date): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const events = await googleCalendarService.getEvents(timeMin, timeMax);
      return events;
    } catch (err: any) {
      console.error('Failed to get events', err);
      setError(err.message || 'Failed to get events');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createLeaveEvent = async (
    title: string,
    startDate: Date,
    endDate: Date,
    description?: string
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await googleCalendarService.createLeaveEvent(
        title,
        startDate,
        endDate,
        description
      );
      return result;
    } catch (err: any) {
      console.error('Failed to create leave event', err);
      setError(err.message || 'Failed to create leave event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncHolidays = async (holidays: any[]): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await googleCalendarService.syncHolidays(holidays);
      return results;
    } catch (err: any) {
      console.error('Failed to sync holidays', err);
      setError(err.message || 'Failed to sync holidays');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncWorkSchedule = async (schedules: any[]): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await googleCalendarService.syncWorkSchedule(schedules);
      return results;
    } catch (err: any) {
      console.error('Failed to sync work schedule', err);
      setError(err.message || 'Failed to sync work schedule');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isInitialized,
    isSignedIn,
    isLoading,
    error,
    initialize,
    signIn,
    signOut,
    createEvent,
    getEvents,
    createLeaveEvent,
    syncHolidays,
    syncWorkSchedule,
  };

  return (
    <GoogleCalendarContext.Provider value={value}>
      {children}
    </GoogleCalendarContext.Provider>
  );
};

export default GoogleCalendarProvider; 