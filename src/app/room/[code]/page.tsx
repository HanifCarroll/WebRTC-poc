"use client";

import {
	ControlBar,
	GridLayout,
	LiveKitRoom,
	MediaDeviceMenu,
	ParticipantTile,
	RoomAudioRenderer,
	useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomPage({ params }: { params: { code: string } }) {
	const [username, setUsername] = useState("");
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleJoin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (username.trim() === "") return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/get-participant-token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ room: params.code, username: username.trim() }),
			});

			const data = await response.json();

			if (response.ok) {
				setToken(data.token);
			} else {
				alert(data.error || "Failed to join the meeting.");
			}
		} catch (error) {
			console.error(error);
			alert("An error occurred while joining the meeting.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100">
				<svg
					className="animate-spin h-10 w-10 text-blue-500"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-label="Loading..."
				>
					<title>Loading Indicator</title>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8v8H4z"
					/>
				</svg>
			</div>
		);
	}

	if (!token) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100">
				<div className="bg-white p-8 rounded shadow-md w-full max-w-md">
					<h1 className="text-2xl font-semibold text-center mb-6">
						Enter your username
					</h1>
					<form onSubmit={handleJoin} className="space-y-4">
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Your name"
							className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
						<button
							type="submit"
							className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-200"
						>
							Join Meeting
						</button>
					</form>
				</div>
			</div>
		);
	}

	return (
		<LiveKitRoom
			video={true}
			audio={true}
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ""}
			data-lk-theme="default"
			className="h-screen"
		>
			<MediaDeviceMenu />
			<MyVideoConference />
			<RoomAudioRenderer />
			<ControlBar />
		</LiveKitRoom>
	);
}

function MyVideoConference() {
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false },
	);

	return (
		<GridLayout
			tracks={tracks}
			className="h-[calc(100vh-var(--lk-control-bar-height))]"
		>
			<ParticipantTile />
		</GridLayout>
	);
}
