import { NextResponse } from 'next/server';
import axios from 'axios';

const SEND_MESSAGE_URL = "https://us-central1-clienthive-hkl1l.cloudfunctions.net/sendMessage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, number, message } = body;

    if (!sessionId || !number || !message) {
      return NextResponse.json({ error: 'sessionId, number, dan message wajib diisi.' }, { status: 400 });
    }

    // Forward the request body directly to the Cloud Function
    const cloudFunctionResponse = await axios.post(SEND_MESSAGE_URL, body);

    // Return the response from the Cloud Function to the client
    return NextResponse.json(cloudFunctionResponse.data, { status: cloudFunctionResponse.status || 200 });

  } catch (error: any) {
    console.error('API Proxy Error (/api/whatsapp/send):', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || 'Terjadi kesalahan pada server proxy.';
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
