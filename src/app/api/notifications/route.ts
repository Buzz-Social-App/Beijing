import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes (Vercel Pro/Enterprise) or 60s for Hobby

interface NotificationPayload {
    to: string;
    title: string;
    body: string;
    data: Record<string, string>;
}

const EXPO_BATCH_LIMIT = 100;
const CONCURRENT_LIMIT = 20; // Expo allows high concurrency

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

async function sendBatch(notifications: NotificationPayload[]): Promise<{ success: boolean; sent: number; error?: string }> {
    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'host': 'exp.host',
                'accept': 'application/json',
                'accept-encoding': 'gzip, deflate',
                'content-type': 'application/json'
            },
            body: JSON.stringify(notifications)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Expo API error:', result);
            return { success: false, sent: 0, error: JSON.stringify(result) };
        }

        return { success: true, sent: notifications.length };
    } catch (err) {
        return { success: false, sent: 0, error: String(err) };
    }
}

export async function POST(request: Request) {
    try {
        const notifications: NotificationPayload[] = await request.json();
        console.log(`Sending ${notifications.length} notifications...`);

        const chunks = chunkArray(notifications, EXPO_BATCH_LIMIT);
        let totalSent = 0;
        let totalFailed = 0;

        // Process all chunks with high concurrency
        for (let i = 0; i < chunks.length; i += CONCURRENT_LIMIT) {
            const batch = chunks.slice(i, i + CONCURRENT_LIMIT);
            const batchResults = await Promise.all(batch.map(chunk => sendBatch(chunk)));
            
            for (const result of batchResults) {
                if (result.success) {
                    totalSent += result.sent;
                } else {
                    totalFailed += EXPO_BATCH_LIMIT;
                    console.error('Batch failed:', result.error);
                }
            }
            
            console.log(`Progress: ${Math.min((i + CONCURRENT_LIMIT), chunks.length)}/${chunks.length} batches`);
        }

        console.log(`Done: ${totalSent} sent, ${totalFailed} failed`);

        return NextResponse.json({
            success: true,
            sent: totalSent,
            failed: totalFailed,
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