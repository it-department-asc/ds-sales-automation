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

  // Get user's sales summaries
  const userSalesSummaries = useQuery(api.userSalesSummaries.getUserSalesSummaries);

  useEffect(() => {
    // Only show modal for regular users, not admins
    if (currentUser?.role === 'admin' || !userSalesSummaries) return;

    // Helper function to get current Philippine date (YYYY-MM-DD)
    const getPhilippineDate = () => {
      const now = new Date();
      // Philippine time is UTC+8
      const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      return philippineTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Helper function to check if a date is today in Philippine time
    const isTodayPhilippineTime = (date: Date) => {
      const datePhilippine = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      const todayPhilippine = getPhilippineDate();
      return datePhilippine.toISOString().split('T')[0] === todayPhilippine;
    };

    // Check if user has submitted for today (Philippine time)
    const hasSubmittedToday = userSalesSummaries.some(summary => {
      const summaryDate = new Date(summary.createdAt);
      return isTodayPhilippineTime(summaryDate);
    });

    // Show modal if not submitted for today
    if (!hasSubmittedToday) {
      setIsOpen(true);
    }
  }, [currentUser, userSalesSummaries]);

  // Don't render anything for admins
  if (currentUser?.role === 'admin') return null;

  // Get today's date for display
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
                You haven't submitted your sales summary for <strong>{todayFormatted}</strong> yet.
              </p>
              <p className="text-gray-600 text-sm">
                Please complete your sales summary submission as soon as possible to maintain accurate records.
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 text-sm font-medium">
              ⏰ Deadline: Sales summaries should be submitted by 10:00 AM daily
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