import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { type NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

export async function GET(req: NextRequest, res: NextResponse) {
	if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
		return NextResponse.json({ error: "Server misconfigured" });
	}

	const svc = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);
	try {
		const rooms = await svc.listRooms();
		const roomNames = rooms.map((room) => room.name);
		return NextResponse.json({ rooms: roomNames });
	} catch (error) {
		console.error("Error fetching room list:", error);
		return NextResponse.json({ error: "Unable to fetch room list" });
	}
}
