"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FilterIcon, SearchIcon, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Event } from "@/lib/types"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"

const statusOptions = ["LIVE", "PENDING", "DRAFT"]
const hostOptions = ["ANON", "AUTHED"]

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
    const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null)

    // State for search and pagination
    const filters = {
        status: ['LIVE', 'PENDING', 'DRAFT'],
        host: ['ANON', 'AUTHED']
    }
    const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>(filters)
    const [searchQuery, setSearchQuery] = React.useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const [page, setPage] = React.useState(1)
    const [totalEvents, setTotalEvents] = React.useState(0)
    const eventsPerPage = 15

    const router = useRouter()

    const createHostQuery = (host: string[]) => {
        const queryParts = []
        if (host.includes("AUTHED")) {
            queryParts.push('host_id.not.is.null')
        }
        if (host.includes("ANON")) {
            queryParts.push('host_id.is.null')
        }
        return queryParts.join(',')
    }

    // Fetch all events data with relationships
    React.useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true)
            try {
                // Single query to get events with profiles and tags
                const hostQuery = createHostQuery(activeFilters.host)
                // Pagination logic
                const from = (page - 1) * eventsPerPage
                const to = from + eventsPerPage - 1
                const { data: eventsData, error: eventsError, count } = await supabase
                    .from('events')
                    .select(`
                        *,
                        profiles(username),
                        guests(name, email)
                    `, { count: 'exact' })
                    .like('name', `%${debouncedSearchQuery}%`)
                    .in('status', activeFilters.status)
                    .or(hostQuery)
                    .range(from, to)
                // .filter('host_id', activeFilters.host.includes("ANON") && !activeFilters.host.includes("AUTHED") ? 'is.null' : 'not.is.null', null)

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
    }, [debouncedSearchQuery, activeFilters, page])

    // Reset page to 1 when filters or search change
    React.useEffect(() => {
        setPage(1)
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

    const handleToggleAdvert = async (event: Event) => {
        const { error } = await supabase
            .from('events')
            .update({ is_advert: !event.is_advert })
            .eq('id', event.id)

        if (error) {
            console.error(error)
        } else {
            setEvents(prevEvents =>
                prevEvents.map(e => e.id === event.id ? { ...e, is_advert: !event.is_advert } : e)
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

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventToDelete.id)

            if (error) throw error

            // Update local state by removing the deleted event
            setEvents(prevEvents => prevEvents.filter(e => e.id !== eventToDelete.id))
            setEventToDelete(null)
        } catch (err) {
            console.error("Error deleting event:", err)
        }
    }

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
        <div className="flex flex-row h-[calc(100vh-4rem)] p-4 gap-4">
            {/* Filters Modal Trigger */}
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-start">
                {/* Search Bar */}
                <div className="relative mb-6 w-full flex flex-row justify-center gap-4 max-w-screen-md">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        className="pl-10 bg-neutral-950"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* {searchQuery && debouncedSearchQuery !== searchQuery && (
                        <div className="absolute right-3 top-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )} */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="mb-4 mr-4" variant="outline">
                                <FilterIcon className="h-5 w-5 mr-2" />
                                Filters
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-950">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FilterIcon className="h-5 w-5" />
                                    Filters
                                </DialogTitle>
                                <DialogDescription>Filter events by criteria</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
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
                                    <div className="space-y-2 mt-4">
                                        <h3 className="text-sm font-medium">Host</h3>
                                        <div className="space-x-1 flex flex-row">
                                            <Button
                                                variant={activeFilters.host.length === hostOptions.length ? "default" : "ghost"}
                                                className="w-1/3 justify-center h-8 px-2 font-normal"
                                                onClick={() => handleToggleFilter("host", hostOptions)}
                                            >
                                                ALL
                                            </Button>
                                            {hostOptions.map((status) => (
                                                <Button
                                                    key={status}
                                                    variant={activeFilters.host.includes(status) && activeFilters.host.length !== hostOptions.length ? "default" : "ghost"}
                                                    className="w-1/3 justify-center h-8 px-2 font-normal"
                                                    onClick={() => handleToggleFilter("host", [status])}
                                                >
                                                    {status}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* Events Table */}
                <Table className="flex-1">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Promoted</TableHead>
                            <TableHead>Actions</TableHead>
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
                                <TableCell>
                                    <p className="text-sm font-medium">
                                        {event.profiles?.username || `ANON`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {event.guests?.email}
                                    </p>
                                </TableCell>
                                <TableCell>{formatDate(event.date)}</TableCell>
                                <TableCell>{event.location || event.city}</TableCell>
                                <TableCell onClick={() => handleChangeStatus(event)}>
                                    <Badge className="cursor-pointer w-full" variant={event.status === "LIVE" ? "default" : "secondary"}>
                                        {event.status}
                                    </Badge>
                                </TableCell>
                                <TableCell onClick={() => handleToggleAdvert(event)}>
                                    <Badge className="cursor-pointer w-full" variant={event.is_advert ? "default" : "secondary"}>
                                        {event.is_advert ? "PROMOTED" : "STANDARD"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEventToDelete(event);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
            </div >

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <DialogContent className="bg-neutral-950">
                    <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{eventToDelete?.name}&rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEventToDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteEvent}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
