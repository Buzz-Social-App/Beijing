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
import { FilterIcon, SearchIcon, ChevronLeft, ChevronRight, Trash2, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface Advert {
    id: string
    title: string
    image_url: string | null
    link_url: string | null
    status: "LIVE" | "PENDING" | "DRAFT"
    created_at: string
    updated_at: string
}

const statusOptions = ["LIVE", "PENDING", "DRAFT"]

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

export default function AdvertsPage() {
    const router = useRouter()
    // State for adverts data
    const [adverts, setAdverts] = React.useState<Advert[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [advertToDelete, setAdvertToDelete] = React.useState<Advert | null>(null)

    // State for search and pagination
    const filters = {
        status: ['LIVE', 'PENDING', 'DRAFT'],
    }
    const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>(filters)
    const [searchQuery, setSearchQuery] = React.useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const [page, setPage] = React.useState(1)
    const [totalAdverts, setTotalAdverts] = React.useState(0)
    const advertsPerPage = 15

    // Fetch all adverts data
    React.useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true)
            try {
                // Pagination logic
                const from = (page - 1) * advertsPerPage
                const to = from + advertsPerPage - 1
                const { data: advertsData, error: advertsError, count } = await supabase
                    .from('adverts')
                    .select('*', { count: 'exact' })
                    .like('title', `%${debouncedSearchQuery}%`)
                    .in('status', activeFilters.status)
                    .range(from, to)

                if (advertsError) throw new Error(`Error fetching adverts: ${advertsError.message}`)

                // Set total count for pagination
                if (count !== null) {
                    setTotalAdverts(count)
                }

                if (!advertsData) {
                    setAdverts([])
                    setIsLoading(false)
                    return
                }

                // Store the data
                setAdverts(advertsData as Advert[])

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load adverts"
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

    const handleChangeStatus = async (advert: Advert) => {
        if (advert.status === "DRAFT") {
            return
        }

        const newStatus = advert.status === "LIVE" ? "PENDING" : "LIVE"
        const { error } = await supabase
            .from('adverts')
            .update({ status: newStatus })
            .eq('id', advert.id)

        if (error) {
            console.error(error)
        } else {
            // Update local state with the new status
            setAdverts(prevAdverts =>
                prevAdverts.map(a =>
                    a.id === advert.id ? { ...a, status: newStatus } : a
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

    // Calculate total pages
    const totalPages = Math.ceil(totalAdverts / advertsPerPage)

    const handleDeleteAdvert = async () => {
        if (!advertToDelete) return

        try {
            const { error } = await supabase
                .from('adverts')
                .delete()
                .eq('id', advertToDelete.id)

            if (error) throw error

            // Update local state by removing the deleted advert
            setAdverts(prevAdverts => prevAdverts.filter(a => a.id !== advertToDelete.id))
            setAdvertToDelete(null)
        } catch (err) {
            console.error("Error deleting advert:", err)
        }
    }

    const handleAdvertClick = (advert: Advert) => {
        router.push(`/adverts/submission?id=${advert.id}`)
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
            <div className="flex-1 flex flex-col items-start">
                {/* Search Bar */}
                <div className="relative mb-6 w-full flex flex-row justify-center gap-4 max-w-screen-md">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search adverts..."
                        className="pl-10 bg-neutral-950"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                                <DialogDescription>Filter adverts by criteria</DialogDescription>
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
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* Adverts Table */}
                <Table className="flex-1">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            {/* Removed Image column */}
                            <TableHead>Link</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {adverts.map((advert) => (
                            <TableRow
                                key={advert.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleAdvertClick(advert)}
                            >
                                <TableCell>{advert.title}</TableCell>
                                {/* Removed Image cell */}
                                <TableCell
                                    onClick={e => e.stopPropagation()}
                                >
                                    {advert.link_url ? (
                                        <a
                                            href={advert.link_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Visit Link
                                        </a>
                                    ) : 'No link'}
                                </TableCell>
                                <TableCell
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleChangeStatus(advert);
                                    }}
                                >
                                    <Badge className="cursor-pointer w-full" variant={advert.status === "LIVE" ? "default" : "secondary"}>
                                        {advert.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAdvertToDelete(advert);
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
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!advertToDelete} onOpenChange={(open) => !open && setAdvertToDelete(null)}>
                <DialogContent className="bg-neutral-950">
                    <DialogHeader>
                        <DialogTitle>Delete Advert</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{advertToDelete?.title}&rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdvertToDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAdvert}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
