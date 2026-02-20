"use client"
import { useState } from "react";

import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface Profile {
    id: string;
    username: string;
    name: string;
    dob: string;
    bio: string;
    avatar_url: string;
    instagram_username: string;
    spotify_username: string;
    push_token?: string;
}

const BATCH_SIZE = 500; // Send 500 notifications per API call to stay under 10s timeout

const NotificationsPage = () => {

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [data, setData] = useState("{}")
    const [progress, setProgress] = useState<string | null>(null)
    const [dryRun, setDryRun] = useState(true)

    const filters = {
        min_age: 18,
        max_age: 200,
    }
    const [activeFilters, setActiveFilters] = useState<Record<string, number>>(filters)

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true)
            try {
                const PAGE_SIZE = 1000
                let allProfiles: Profile[] = []
                let page = 0
                let hasMore = true

                while (hasMore) {
                    const from = page * PAGE_SIZE
                    const to = from + PAGE_SIZE - 1

                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select(`*`)
                        .not('push_token', 'is', null)
                        .gte('dob', new Date(new Date().setFullYear(new Date().getFullYear() - activeFilters.max_age)).toISOString())
                        .lte('dob', new Date(new Date().setFullYear(new Date().getFullYear() - activeFilters.min_age)).toISOString())
                        .range(from, to)

                    if (profilesError) throw new Error(`Error fetching profiles: ${profilesError.message}`)

                    if (!profilesData || profilesData.length === 0) {
                        hasMore = false
                    } else {
                        allProfiles = [...allProfiles, ...(profilesData as unknown as Profile[])]
                        hasMore = profilesData.length === PAGE_SIZE
                        page++
                    }
                }

                console.log(`Fetched ${allProfiles.length} profiles`)
                setProfiles(allProfiles)

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load events"
                setError(errorMessage)
            }
            setIsLoading(false)
        }

        fetchAllData()
    }, [activeFilters])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setProgress(null)

        try {
            const allNotifications = profiles.map(profile => ({
                to: profile.push_token,
                title: title,
                body: body,
                data: JSON.parse(data),
            }))

            // Split into batches to avoid Vercel timeout
            const batches = []
            for (let i = 0; i < allNotifications.length; i += BATCH_SIZE) {
                batches.push(allNotifications.slice(i, i + BATCH_SIZE))
            }

            let totalSent = 0
            let totalFailed = 0

            for (let i = 0; i < batches.length; i++) {
                setProgress(`${dryRun ? '[TEST] ' : ''}Sending batch ${i + 1}/${batches.length}...`)
                
                const response = await fetch(`/api/notifications${dryRun ? '?dryRun=true' : ''}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(batches[i])
                })

                if (!response.ok) {
                    totalFailed += batches[i].length
                    console.error(`Batch ${i + 1} failed`)
                } else {
                    const result = await response.json()
                    totalSent += result.sent || batches[i].length
                }
            }

            setProgress(`${dryRun ? '[TEST] ' : ''}Done! Sent ${totalSent}, Failed ${totalFailed}`)
            
            // Clear the form
            setTitle('')
            setBody('')
            setData("{}")
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send notifications')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold mb-4">Send Notifications</h1>

        <div className="flex flex-col gap-4">
            {/* Filters Section */}
            <div className="bg-background p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-3">Filter Profiles</h2>
                {!isLoading && <p className="font-bold mb-3">{`${profiles.length} profiles found`}</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Min Age</label>
                        <input 
                            type="number"
                            min="0"
                            max="200"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            value={activeFilters.min_age}
                            onChange={(e) => {
                                setActiveFilters({ ...activeFilters, min_age: parseInt(e.target.value) })
                            }}
                            placeholder="Minimum age"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Max Age</label>
                        <input 
                            type="number"
                            min="0"
                            max="200"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            value={activeFilters.max_age}
                            onChange={(e) => {
                                setActiveFilters({ ...activeFilters, max_age: parseInt(e.target.value) })
                            }}
                            placeholder="Maximum age"
                        />
                    </div>
                </div>
            </div>

            {/* Notification Form */}
            <div className="bg-background p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-3">Create Notification</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            placeholder="Notification title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium ">Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            rows={4}
                            placeholder="Notification message"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium ">Additional Data (JSON)</label>
                        <textarea
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary font-mono"
                            rows={4}
                            placeholder='{"key": "value"}'
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    {progress && <p className="text-blue-500 font-medium">{progress}</p>}
                    <div className="flex items-center gap-4 justify-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dryRun}
                                onChange={(e) => setDryRun(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">Test mode (no notifications sent)</span>
                        </label>
                        <Button type="submit" variant="default" disabled={isLoading}>
                            {isLoading ? 'Sending...' : dryRun ? 'Test Run' : 'Send Notification'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    )
}

export default NotificationsPage;