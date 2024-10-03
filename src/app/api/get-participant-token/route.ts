import { AccessToken } from "livekit-server-sdk";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { room, username } = await req.json();

    if (!room) {
      return NextResponse.json(
        { error: 'Missing "room" parameter' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Missing "username" parameter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, { identity: username });

    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    return NextResponse.json({ token: await at.toJwt() });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}