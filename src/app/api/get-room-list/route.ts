import { RoomServiceClient } from "livekit-server-sdk";
import { type NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

export async function GET(req: NextRequest) {
	if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
		return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
	}

	const svc = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);
	
	try {
		const rooms = await svc.listRooms();
		const roomNames = rooms.map((room) => room.name);
		
		// Add a timestamp to ensure the response is always unique
		const response = { 
			rooms: roomNames, 
			timestamp: new Date().toISOString() 
		};

		return NextResponse.json(response, {
			headers: {
				'Cache-Control': 'no-store, max-age=0',
			},
		});
	} catch (error) {
		console.error("Error fetching room list:", error);
		return NextResponse.json({ error: "Unable to fetch room list" }, { status: 500 });
	}
}
