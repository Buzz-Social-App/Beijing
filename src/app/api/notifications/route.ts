import { NextResponse } from 'next/server';

interface NotificationPayload {
    to: string;
    title: string;
    body: string;
    data: Record<string, string>;
}

export async function POST(request: Request) {
    try {
        const notifications: NotificationPayload[] = await request.json();

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notifications)
        });

        if (!response.ok) {
            throw new Error('Failed to send notifications');
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json(
            { error: 'Failed to send notifications' },
            { status: 500 }
        );
    }
} 