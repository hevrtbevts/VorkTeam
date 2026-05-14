
import { NextResponse } from 'next/server';
import axios from 'axios';

const RECEIVE_WEBHOOK_URL = "https://us-central1-clienthive-hkl1l.cloudfunctions.net/receiveWebhook";

export async function GET() {
  try {
    // Forward the request to the actual Cloud Function
    const cloudFunctionResponse = await axios.get(RECEIVE_WEBHOOK_URL);

    // Return the response from the Cloud Function to the client
    return NextResponse.json(cloudFunctionResponse.data, { status: cloudFunctionResponse.status || 200 });

  } catch (error: any) {
    console.error('API Proxy Error (/api/whatsapp/logs):', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || 'Terjadi kesalahan pada server proxy.';
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
