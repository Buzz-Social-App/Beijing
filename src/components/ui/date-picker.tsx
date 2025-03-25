"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date;
    setDate?: (date: Date | undefined) => void;
    className?: string;
}

export function DatePicker({ date, setDate, className }: DatePickerProps = {}) {
    const [internalDate, setInternalDate] = React.useState<Date | undefined>(date);

    const handleSelect = (selectedDate: Date | undefined) => {
        setInternalDate(selectedDate);
        if (setDate) {
            setDate(selectedDate);
        }
    };

    // Use either the external or internal state
    const displayDate = date ?? internalDate;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !displayDate && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {displayDate ? format(displayDate, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={displayDate}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
