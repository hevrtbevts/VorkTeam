'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// The local API proxy route
const SEND_MESSAGE_URL = "/api/whatsapp/send";

export default function WhatsAppPage() {
    const [sessionId, setSessionId] = useState('default');
    const [number, setNumber] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const handleSend = async () => {
        if (!sessionId || !number || !message) {
            setResponse({ error: "Semua field wajib diisi!" });
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const res = await axios.post(SEND_MESSAGE_URL, {
                sessionId,
                number,
                message,
            });
            setResponse(res.data);
        } catch (err: any) {
            setResponse(err.response?.data || { error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>📲 WhatsApp Tools</CardTitle>
                    <CardDescription>Kirim pesan langsung melalui API.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sessionId">Session ID</Label>
                            <Input
                                id="sessionId"
                                type="text"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="number">Nomor Tujuan (cth: 628...)</Label>
                            <Input
                                id="number"
                                type="text"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Pesan</Label>
                            <Textarea
                                id="message"
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Mengirim..." : "Kirim Pesan"}
                        </Button>

                        {response && (
                            <div className="mt-4 p-3 border rounded-md bg-muted">
                                <pre className="text-sm whitespace-pre-wrap break-all">
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
