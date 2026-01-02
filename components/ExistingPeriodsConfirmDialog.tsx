'use client';

import { useState } from "react";
import { ResponsiveDialog } from "@/app/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";

interface ExistingPeriodsConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingPeriods: string[];
    onConfirm: () => void;
    onCancel: () => void;
}

function CalendarView({ existingPeriods }: { existingPeriods: string[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Parse period strings to Date objects
    const parsePeriodToDate = (period: string): Date | null => {
        try {
            // Handle format like "December 18, 2025"
            const date = new Date(period);
            return isNaN(date.getTime()) ? null : date;
        } catch {
            return null;
        }
    };

    const uploadedDates = existingPeriods
        .map(parsePeriodToDate)
        .filter((date): date is Date => date !== null);

    const isDateUploaded = (date: Date) => {
        return uploadedDates.some(uploadedDate =>
            uploadedDate.toDateString() === date.toDateString()
        );
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
            <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Upload Calendar
            </h4>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-1 sm:mb-2">
                <button
                    onClick={() => navigateMonth('prev')}
                    className="p-0.5 hover:bg-amber-100 rounded transition-colors"
                >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h3 className="text-xs sm:text-sm font-semibold text-amber-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button
                    onClick={() => navigateMonth('next')}
                    className="p-0.5 hover:bg-amber-100 rounded transition-colors"
                >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-xs font-medium text-amber-600 text-center py-0.5">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {days.map((date, index) => (
                    <div
                        key={index}
                        className={`
              h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-xs relative mx-auto
              ${date ? 'hover:bg-amber-100 cursor-pointer rounded transition-colors' : ''}
              ${date && isDateUploaded(date) ? 'bg-green-100 border border-green-300' : ''}
              ${date && isToday(date) && !isDateUploaded(date) ? 'bg-blue-100 ring-2 ring-blue-400 ring-offset-1' : ''}
              ${date && isToday(date) && isDateUploaded(date) ? 'ring-2 ring-blue-400 ring-offset-1 bg-green-100 border-green-300' : ''}
            `}
                    >
                        {date && (
                            <>
                                <span className={`font-medium ${isDateUploaded(date) ? 'text-green-800' : 'text-amber-700'}`}>
                                    {date.getDate()}
                                </span>
                                {isDateUploaded(date) && (
                                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend - Hidden on mobile */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-1 pt-2 border-t border-amber-200">
                <div className="flex items-center gap-2 text-xs text-amber-700">
                    <div className="w-3 h-3 bg-green-400 border border-green-300 rounded ring-1 ring-green-400 ring-offset-1"></div>
                    <span>Uploaded</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700">
                    <div className="w-3 h-3 bg-blue-400 border border-amber-200 rounded ring-1 ring-blue-400 ring-offset-1"></div>
                    <span>Today</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700">
                    <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded ring-1 ring-amber-400 ring-offset-1"></div>
                    <span>Not uploaded</span>
                </div>
            </div>
        </div>
    );
}

interface ExistingPeriodsConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingPeriods: string[];
    onConfirm: () => void;
    onCancel: () => void;
}

export function ExistingPeriodsConfirmDialog({
    open,
    onOpenChange,
    existingPeriods,
    onConfirm,
    onCancel
}: ExistingPeriodsConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onCancel();
        onOpenChange(false);
    };

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Sales Summary Already Exists"
            description="You've already uploaded sales summaries for some dates. Do you want to update the existing summary?"
        >
            <div className="space-y-4">
                <CalendarView existingPeriods={existingPeriods} />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>What happens next?</strong><br />
                        Your new data will update the existing summary for this period. Previous data will be replaced.
                    </p>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6">
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="sm:w-auto"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    className="sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                    Update Summary
                </Button>
            </div>
        </ResponsiveDialog>
    );
}