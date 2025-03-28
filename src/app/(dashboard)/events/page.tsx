"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FilterIcon, SearchIcon, Loader2, ChevronLeft, ChevronRight, CheckIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Event } from "@/lib/types"

const statusOptions = ["LIVE", "PENDING", "DRAFT"]

// interface FilterState {
//     status: string | null;
//     city: string | null;
//     tag: string | null;
// }

// Create a custom debounce hook
const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default function EventsPage() {
    // State for events data
    const [events, setEvents] = React.useState<Event[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    // State for search and pagination
    const filters = {
        status: ['LIVE', 'PENDING', 'DRAFT'],
    }
    const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>(filters)
    const [searchQuery, setSearchQuery] = React.useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const [page, setPage] = React.useState(1)
    const [totalEvents, setTotalEvents] = React.useState(0)
    const eventsPerPage = 10

    const router = useRouter()

    // Fetch all events data with relationships
    React.useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true)
            try {
                // Single query to get events with profiles and tags
                const { data: eventsData, error: eventsError, count } = await supabase
                    .from('events')
                    .select(`
                        *,
                        profiles(username)
                    `, { count: 'exact' })
                    .like('name', `%${debouncedSearchQuery}%`)
                    .in('status', activeFilters.status)
                // tags:events_tags!event_id(tag:tags(title, icon))


                console.log(eventsData)

                if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`)

                // Set total count for pagination
                if (count !== null) {
                    setTotalEvents(count)
                }

                if (!eventsData) {
                    setEvents([])
                    setIsLoading(false)
                    return
                }

                // Store the raw data
                setEvents(eventsData as unknown as Event[])

                // Log raw data for debugging
                if (eventsData.length > 0) {
                    console.log('Raw event data with relationships:', eventsData[0])
                }

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load events"
                setError(errorMessage)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAllData()
    }, [debouncedSearchQuery, activeFilters])

    const handleChangeStatus = async (event: Event) => {

        if (event.status === "DRAFT") {
            return
        }

        const newStatus = event.status === "LIVE" ? "PENDING" : "LIVE"
        const { error } = await supabase
            .from('events')
            .update({ status: newStatus })
            .eq('id', event.id)

        if (error) {
            console.error(error)
        } else {
            // Update local state with the new status
            setEvents(prevEvents =>
                prevEvents.map(e =>
                    e.id === event.id ? { ...e, status: newStatus } : e
                )
            )
        }
    }

    const handleToggleFilter = (filter: keyof typeof filters, values: string[]) => {
        setActiveFilters(prevFilters => ({
            ...prevFilters,
            [filter]: values
        }));
    }

    // Format date to readable string
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM d, yyyy')
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalEvents / eventsPerPage)

    if (error) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-destructive text-lg">{error}</div>
                <Button
                    className="mt-4"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold mb-4">Events</h1>
                <Button asChild>
                    <Link href="/events/edit">Add New Event</Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Main content with table */}
                <div className="flex-1 max-w-[60vw]">
                    {/* Search bar */}
                    <div className="relative mb-6">
                        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && debouncedSearchQuery !== searchQuery && (
                            <div className="absolute right-3 top-3">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Active filters display */}
                    {/* {(activeFilters.status || activeFilters.city || activeFilters.tag) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-sm text-muted-foreground pt-1">Filters:</span>
                            <Button
                                variant="ghost"
                                className="text-xs h-7 px-2"
                                onClick={() => setActiveFilters({ status: null, city: null, tag: null })}
                            >
                                Clear all
                            </Button>
                        </div>
                    )} */}

                    {/* Table */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Host</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((event: Event) => (
                                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell
                                            onClick={() => {
                                                router.push(`/events/${event.id}`)
                                            }}
                                        >{event.name}</TableCell>
                                        <TableCell>{event.profiles?.username || "-"}</TableCell>
                                        <TableCell>{formatDate(event.date)}</TableCell>
                                        <TableCell>{event.location || event.city}</TableCell>
                                        <TableCell onClick={() => handleChangeStatus(event)}>
                                            <Badge className="cursor-pointer w-full" variant={event.status === "LIVE" ? "default" : "secondary"}>
                                                {event.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous Page</span>
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages || isLoading}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next Page</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filters sidebar */}
                <div className="w-full md:w-80">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FilterIcon className="h-5 w-5" />
                                Filters
                            </CardTitle>
                            <CardDescription>Filter events by criteria</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Status filter */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Status</h3>
                                <div className="space-x-1 flex flex-row">
                                    <Button
                                        variant={activeFilters.status.length === statusOptions.length ? "default" : "ghost"}
                                        className="w-1/4 justify-center h-8 px-2 font-normal"
                                        onClick={() => handleToggleFilter("status", activeFilters.status.length === statusOptions.length ? [] : statusOptions)}
                                    >
                                        ALL
                                    </Button>
                                    {statusOptions.map((status) => (
                                        <Button
                                            key={status}
                                            variant={activeFilters.status.includes(status) && activeFilters.status.length !== statusOptions.length ? "default" : "ghost"}
                                            className="w-1/4 justify-center h-8 px-2 font-normal"
                                            onClick={() => handleToggleFilter("status", activeFilters.status.length === statusOptions.length ? [status] : [...activeFilters.status, status])}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* City filter */}
                            {/* <div className="space-y-2">
                                <h3 className="text-sm font-medium">City</h3>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {cityOptions.length === 0 ? (
                                        <div className="py-2 text-sm text-muted-foreground">
                                            Loading cities...
                                        </div>
                                    ) : (
                                        cityOptions.map((city) => (
                                            <Button
                                                key={city}
                                                variant="ghost"
                                                className="w-full justify-start h-8 px-2 font-normal"
                                                onClick={() => toggleFilter("city", city)}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{city}</span>
                                                    {activeFilters.city === city && (
                                                        <CheckIcon className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </Button>
                                        ))
                                    )}
                                </div>
                            </div> */}

                            {/* Tags filter */}
                            {/* {tagOptions.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium flex items-center gap-1">
                                        <TagIcon className="h-4 w-4 text-muted-foreground" />
                                        Tags
                                    </h3>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {tagOptions.map((tag) => (
                                            <Button
                                                key={tag}
                                                variant="ghost"
                                                className="w-full justify-start h-8 px-2 font-normal"
                                                onClick={() => toggleFilter("tag", tag)}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{tag}</span>
                                                    {activeFilters.tag === tag && (
                                                        <CheckIcon className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )} */}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
