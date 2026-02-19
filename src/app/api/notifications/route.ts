import { NextResponse } from 'next/server';

interface NotificationPayload {
    to: string;
    title: string;
    body: string;
    data: Record<string, string>;
}

const EXPO_BATCH_LIMIT = 100;

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export async function POST(request: Request) {
    try {
        const notifications: NotificationPayload[] = await request.json();

        const chunks = chunkArray(notifications, EXPO_BATCH_LIMIT);
        const results = [];

        for (const chunk of chunks) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'host': 'exp.host',
                    'accept': 'application/json',
                    'accept-encoding': 'gzip, deflate',
                    'content-type': 'application/json'
                },
                body: JSON.stringify(chunk)
            });

            const result = await response.json();
            
            if (!response.ok) {
                console.error('Expo API error:', result);
                throw new Error(`Failed to send notifications: ${JSON.stringify(result)}`);
            }

            results.push(result);
        }

        return NextResponse.json({
            success: true,
            batches: results.length,
            total: notifications.length
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json(
            { error: 'Failed to send notifications' },
            { status: 500 }
        );
    }
} 