'use client';

import DatePicker from "react-datepicker";
// @ts-ignore - CSS import for react-datepicker styles
import "react-datepicker/dist/react-datepicker.css";

const calendarStyles = `
  .submission-calendar {
    font-family: inherit;
    border: none;
    width: 100%;
    background: white;
  }

  .submission-calendar .react-datepicker__month-container {
    width: 100%;
    float: none;
  }

  .submission-calendar .react-datepicker__header {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-bottom: none;
    padding: 16px;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .submission-calendar .react-datepicker__current-month {
    color: white;
    font-weight: 700;
    font-size: 16px;
    text-align: center;
    margin-bottom: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .submission-calendar .react-datepicker__day-names {
    display: flex;
    justify-content: space-between;
    margin: 0;
    padding: 0 12px;
  }

  .submission-calendar .react-datepicker__day-name {
    color: #6b7280;
    font-weight: 500;
    font-size: 12px;
    width: 36px;
    line-height: 36px;
    margin: 0;
    text-align: center;
  }

  .submission-calendar .react-datepicker__month {
    margin: 8px;
  }

  .submission-calendar .react-datepicker__week {
    display: flex;
    justify-content: space-between;
    margin: 0;
    padding: 0 4px;
  }

  .submission-calendar .react-datepicker__day {
    width: 36px;
    height: 36px;
    line-height: 36px;
    margin: 2px 0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
    position: relative;
    cursor: pointer;
  }

  .submission-calendar .react-datepicker__day:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  .submission-calendar .react-datepicker__day--outside-month {
    color: #d1d5db;
  }

  .submission-calendar .react-datepicker__day--today {
    background-color: #3b82f6 !important;
    color: white !important;
    font-weight: 600;
  }

  .submission-calendar .react-datepicker__day--selected,
  .submission-calendar .react-datepicker__day--keyboard-selected {
    background-color: transparent;
    color: #374151;
  }

  .submission-calendar .react-datepicker__day.submission-day {
    background-color: #10b981 !important;
    color: white !important;
    font-weight: 600;
    position: relative;
  }

  .submission-calendar .react-datepicker__day.submission-day::after {
    content: '✓';
    position: absolute;
    top: -6px;
    right: -4px;
    font-size: 10px;
    font-weight: bold;
    background-color: #059669;
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .submission-calendar .react-datepicker__day.submission-day span[data-tooltip]::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    margin-bottom: 8px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }

  .submission-calendar .react-datepicker__day.submission-day.dimmed {
    opacity: 0.4;
  }

  .submission-calendar .react-datepicker__day.submission-day:hover span[data-tooltip]::before {
    opacity: 1;
    visibility: visible;
  }

  .submission-calendar .react-datepicker__navigation {
    top: 16px;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
  }

  .submission-calendar .react-datepicker__navigation--previous {
    left: 12px;
  }

  .submission-calendar .react-datepicker__navigation--next {
    right: 12px;
  }

  .submission-calendar .react-datepicker__navigation-icon::before {
    border-color: #f2f2f2ff;
    border-width: 2px 2px 0 0;
  }
`;

interface UserSubmissionCalendarProps {
  userSalesSummaries: any[];
  className?: string;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

export function UserSubmissionCalendar({ userSalesSummaries, className = "", currentMonth, onMonthChange }: UserSubmissionCalendarProps) {
  // Create a map of dates to creation times for quick lookup
  const submissionTimes = new Map<string, string>();
  userSalesSummaries.forEach(summary => {
    if (summary.period && summary._creationTime) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthMap: { [key: string]: number } = {};
      monthNames.forEach((month, index) => {
        monthMap[month] = index;
      });

      const periodMatch = summary.period.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
      if (periodMatch) {
        const [, monthName, day, year] = periodMatch;
        const month = monthMap[monthName];
        if (month !== undefined) {
          const date = new Date(parseInt(year), month, parseInt(day));
          const dateKey = date.toDateString();
          const creationTime = new Date(summary._creationTime).toLocaleString();
          submissionTimes.set(dateKey, creationTime);
        }
      }
    }
  });

  return (
    <div className={`bg-white rounded-lg border border-gray-200 h-[340px] ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      <DatePicker
        inline
        calendarClassName="submission-calendar"
        formatWeekDay={(day) => day.slice(0, 3)}
        selected={currentMonth}
        onMonthChange={onMonthChange}
        renderDayContents={(dayOfMonth, date) => {
          const dateKey = date.toDateString();
          const creationTime = submissionTimes.get(dateKey);
          // Only show tooltip for dates in the current month
          const isCurrentMonth = currentMonth &&
            date.getMonth() === currentMonth.getMonth() &&
            date.getFullYear() === currentMonth.getFullYear();
          const tooltipText = (creationTime && isCurrentMonth) ? `Submitted: ${creationTime}` : undefined;
          return (
            <span data-tooltip={tooltipText}>
              {dayOfMonth}
            </span>
          );
        }}
        highlightDates={userSalesSummaries
          .map(summary => {
            if (!summary.period) return null;
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthMap: { [key: string]: number } = {};
            monthNames.forEach((month, index) => {
              monthMap[month] = index;
            });

            const periodMatch = summary.period.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
            if (periodMatch) {
              const [, monthName, day, year] = periodMatch;
              const month = monthMap[monthName];
              if (month !== undefined) {
                return new Date(parseInt(year), month, parseInt(day));
              }
            }
            return null;
          })
          .filter(Boolean) as Date[]
        }
        dayClassName={(date) => {
          const hasSubmission = userSalesSummaries.some(summary => {
            if (!summary.period) return false;
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthMap: { [key: string]: number } = {};
            monthNames.forEach((month, index) => {
              monthMap[month] = index;
            });

            const periodMatch = summary.period.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
            if (periodMatch) {
              const [, monthName, day, year] = periodMatch;
              const month = monthMap[monthName];
              if (month !== undefined) {
                const periodDate = new Date(parseInt(year), month, parseInt(day));
                return periodDate.toDateString() === date.toDateString();
              }
            }
            return false;
          });

          if (hasSubmission) {
            // Check if the submission date is in the current month being viewed
            const isCurrentMonth = currentMonth &&
              date.getMonth() === currentMonth.getMonth() &&
              date.getFullYear() === currentMonth.getFullYear();
            return isCurrentMonth ? 'submission-day' : 'submission-day dimmed';
          }

          return '';
        }}
      />
    </div>
  );
}