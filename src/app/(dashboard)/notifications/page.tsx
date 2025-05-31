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

const NotificationsPage = () => {

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [data, setData] = useState({})

    const filters = {
        min_age: 18,
        max_age: 200,
    }
    const [activeFilters, setActiveFilters] = useState<Record<string, number>>(filters)

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true)
            try {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select(`
                        *
                    `, { count: 'exact' })
                    .not('push_token', 'is', null)
                    .gte('dob', new Date(new Date().setFullYear(new Date().getFullYear() - activeFilters.max_age)).toISOString())
                    .lte('dob', new Date(new Date().setFullYear(new Date().getFullYear() - activeFilters.min_age)).toISOString())

                console.log(profilesData)

                if (profilesError) throw new Error(`Error fetching profiles: ${profilesError.message}`)

                if (!profilesData) {
                    setProfiles([])
                    setIsLoading(false)
                    return
                }

                // Store the raw data
                setProfiles(profilesData as unknown as Profile[])

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load events"
                setError(errorMessage)
            }
            setIsLoading(false)
        }

        fetchAllData()
    }, [activeFilters])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const bodyData = []
        for (const profile of profiles) {
            bodyData.push({
                to: profile.push_token,
                title: title,
                body: body,
                data: data,
            })
        }
        fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        })
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
                            value={JSON.stringify(data)}
                            onChange={(e) => setData(JSON.parse(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary font-mono"
                            rows={4}
                            placeholder='{"key": "value"}'
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="flex justify-end">
                        <Button type="submit" variant="default">
                            Send Notification
                        </Button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    )
}

export default NotificationsPage;