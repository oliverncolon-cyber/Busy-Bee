/**
 * Calendar Service for generating 1-Click calendar links and RFC 5545 .ics files
 */

export class CalendarService {
  /**
   * Format ISO Date string into YYYYMMDDTHHmmssZ for calendar URLs
   */
  static formatToUtcCompact(dateObj) {
    return dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }

  /**
   * Escape text per RFC 5545 Section 3.3.11 for .ics TEXT properties
   */
  static escapeIcsText(str = '') {
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  /**
   * Parse relative or absolute time strings (e.g. "tomorrow at 3 PM", "next Monday at 10 AM", ISO 8601)
   */
  static parseDateTime(dateTimeStr, durationMinutes = 45) {
    const safeDuration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 45;
    const now = new Date();
    let startDate = new Date(now.getTime());

    if (!dateTimeStr || typeof dateTimeStr !== 'string') {
      // Default to tomorrow at 10:00 AM
      startDate.setDate(now.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + safeDuration * 60 * 1000);
      return { startDate, endDate };
    }

    const trimmed = dateTimeStr.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check if input is already a strict ISO 8601 timestamp (e.g. "2026-10-19T15:00:00")
    if (/^\d{4}-\d{2}-\d{2}t\d{2}:\d{2}/i.test(trimmed)) {
      const isoParsed = new Date(trimmed);
      if (!isNaN(isoParsed.getTime())) {
        const endDate = new Date(isoParsed.getTime() + safeDuration * 60 * 1000);
        return { startDate: isoParsed, endDate };
      }
    }

    // 2. Relative offset ("in 30 minutes", "in 2 hours")
    const inOffsetMatch = lower.match(/\bin\s+(\d+)\s*(hour|hr|minute|min)s?\b/);
    if (inOffsetMatch) {
      const amount = parseInt(inOffsetMatch[1], 10);
      const unit = inOffsetMatch[2];
      const offsetMs = unit.startsWith('h') ? amount * 3600000 : amount * 60000;
      startDate = new Date(now.getTime() + offsetMs);
      const endDate = new Date(startDate.getTime() + safeDuration * 60 * 1000);
      return { startDate, endDate };
    }

    // 3. Relative day matching (Sunday = 0 ... Saturday = 6)
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    let matchedDay = false;
    if (lower.includes('day after tomorrow')) {
      startDate.setDate(now.getDate() + 2);
      matchedDay = true;
    } else if (lower.includes('tomorrow')) {
      startDate.setDate(now.getDate() + 1);
      matchedDay = true;
    } else if (lower.includes('today') || lower.includes('tonight')) {
      matchedDay = true;
    } else {
      for (const [dayName, dayIndex] of Object.entries(dayMap)) {
        if (lower.includes(dayName)) {
          const daysAhead = (dayIndex + 7 - now.getDay()) % 7 || 7;
          startDate.setDate(now.getDate() + daysAhead);
          matchedDay = true;
          break;
        }
      }
    }

    if (!matchedDay) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed;
      } else {
        startDate.setDate(now.getDate() + 1);
      }
    }

    // 4. Clock hour extraction — requires am/pm, a colon (:00), or "at <hour>" to avoid matching calendar dates
    if (/\bnoon\b/.test(lower)) {
      startDate.setHours(12, 0, 0, 0);
    } else if (/\bmidnight\b/.test(lower)) {
      startDate.setHours(0, 0, 0, 0);
    } else {
      const explicitTimeMatch =
        lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ||
        lower.match(/\b(\d{1,2}):(\d{2})\b/) ||
        lower.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/);

      if (explicitTimeMatch) {
        let hour = parseInt(explicitTimeMatch[1], 10);
        const minute = explicitTimeMatch[2] ? parseInt(explicitTimeMatch[2], 10) : 0;
        const meridian = explicitTimeMatch[3];

        if (meridian === 'pm' && hour < 12) {
          hour += 12;
        } else if (meridian === 'am' && hour === 12) {
          hour = 0;
        } else if (!meridian && hour >= 1 && hour <= 6) {
          // Business hour heuristic: "at 3" -> 15:00 (3 PM)
          hour += 12;
        }

        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          startDate.setHours(hour, minute, 0, 0);
        } else {
          startDate.setHours(15, 0, 0, 0);
        }
      } else {
        // Default to 3:00 PM if no time was specified
        startDate.setHours(15, 0, 0, 0);
      }
    }

    const endDate = new Date(startDate.getTime() + safeDuration * 60 * 1000);
    return { startDate, endDate };
  }

  /**
   * Build clean event body without duplicating quotes
   */
  static buildEventDescription(details = {}) {
    const base = details.description || 'Scheduled via Busy Bee Ambient Intelligence.';
    const hasQuoteAlready = base.includes('Spoken Context:') || base.includes('Context Quote:');
    const quoteLine = !hasQuoteAlready && details.dialogueQuote
      ? `\nSpoken Context: "${details.dialogueQuote}"`
      : '';
    const attendeesLine = details.attendees ? `\nAttendees: ${details.attendees}` : '';
    return `${base}${quoteLine}${attendeesLine}`.trim();
  }

  /**
   * Generate 1-Click Google Calendar URL
   */
  static generateGoogleCalendarUrl(title, details = {}) {
    const { startDate, endDate } = this.parseDateTime(details.dateTime, details.durationMinutes || 45);
    const startStr = this.formatToUtcCompact(startDate);
    const endStr = this.formatToUtcCompact(endDate);

    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: title || 'Meeting (via Busy Bee)',
      dates: `${startStr}/${endStr}`,
      details: this.buildEventDescription(details),
      location: details.location || 'Online / Remote'
    });

    return `${baseUrl}&${params.toString()}`;
  }

  /**
   * Generate 1-Click Outlook Web Calendar URL
   */
  static generateOutlookCalendarUrl(title, details = {}) {
    const { startDate, endDate } = this.parseDateTime(details.dateTime, details.durationMinutes || 45);
    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      subject: title || 'Meeting (via Busy Bee)',
      body: this.buildEventDescription(details),
      location: details.location || 'Remote'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate RFC 5545 .ics file content
   */
  static generateIcs(title, details = {}) {
    const { startDate, endDate } = this.parseDateTime(details.dateTime, details.durationMinutes || 45);
    const startStr = this.formatToUtcCompact(startDate);
    const endStr = this.formatToUtcCompact(endDate);
    const nowStr = this.formatToUtcCompact(new Date());
    const uid = `busybee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@bee.wearable`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Busy Bee//Wearable AI Ambient Copilot//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${this.escapeIcsText(title || 'Meeting')}`,
      `DESCRIPTION:${this.escapeIcsText(this.buildEventDescription(details))}`,
      `LOCATION:${this.escapeIcsText(details.location || 'Online')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }
}