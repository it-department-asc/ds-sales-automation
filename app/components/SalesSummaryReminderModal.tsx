'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

interface SalesSummaryReminderModalProps {
  currentUser: any;
}

export function SalesSummaryReminderModal({ currentUser }: SalesSummaryReminderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [missingDates, setMissingDates] = useState<Date[]>([]);
  const [hasShownReminder, setHasShownReminder] = useState(false);

  // Get user's sales summaries
  const userSalesSummaries = useQuery(api.userSalesSummaries.getUserSalesSummaries);

  // Reset reminder state when user changes
  useEffect(() => {
    setHasShownReminder(false);
  }, [currentUser?.clerkId]);

  useEffect(() => {
    // Only show modal for regular users, not admins
    if (currentUser?.role === 'admin' || !userSalesSummaries || hasShownReminder) return;

    // REMINDER START DATE
    const reminderStartDate = new Date('2026-01-01');
    const currentDate = new Date();
    if (currentDate < reminderStartDate) return;

    const userBranchCode = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : null;
    if (!userBranchCode) return;

    // Helper function to get Philippine date string (YYYY-MM-DD)
    const getPhilippineDateString = (date: Date) => {
      const philippineTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      return philippineTime.toISOString().split('T')[0];
    };

    // Helper function to check if a date matches a Philippine date
    const isSamePhilippineDate = (date: Date, targetDateString: string) => {
      return getPhilippineDateString(date) === targetDateString;
    };

    // Get the last 7 days (excluding today), but not before reminder start date
    const missingDates: Date[] = [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Start from the maximum of (reminderStartDate, 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = reminderStartDate > sevenDaysAgo ? reminderStartDate : sevenDaysAgo;

    for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
      const checkDate = new Date(d);
      const dateString = getPhilippineDateString(checkDate);

      // Check if user has submitted for this date
      const hasSubmitted = userSalesSummaries.some(summary => {
        // Check by period field if it exists and matches the formatted date
        if (summary.period) {
          // Parse the period string like "January 04, 2026" to a date
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
              const periodDateString = getPhilippineDateString(periodDate);
              if (periodDateString === dateString) {
                return true;
              }
            }
          }
        }

        return false;
      });

      if (!hasSubmitted) {
        missingDates.push(new Date(checkDate));
      }
    }

    // Show modal if there are missing dates
    if (missingDates.length > 0) {
      setMissingDates(missingDates);
      setIsOpen(true);
      setHasShownReminder(true);
    }
  }, [currentUser, userSalesSummaries, hasShownReminder]);

  // Don't render anything for admins
  if (currentUser?.role === 'admin') return null;

  // Format missing dates for display
  const formattedMissingDates = missingDates
    .sort((a, b) => b.getTime() - a.getTime()) // Most recent first
    .map(date => date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            Sales Summary Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">
                Daily Sales Report Submission Required
              </p>
              <p className="text-gray-600 text-sm">
                You haven't submitted sales summaries for the following dates:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <ul className="text-red-800 text-sm space-y-1">
                  {formattedMissingDates.map((date, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                      {date}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-gray-600 text-sm">
                Please complete your sales summary submissions as soon as possible to maintain accurate records.
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 text-sm font-medium">
              📊 Please submit your sales summaries regularly to maintain accurate records
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Got it
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}