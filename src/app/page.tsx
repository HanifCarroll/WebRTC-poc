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
import { useEffect, useState } from "react";

export default function Page() {
	const [inputName, setInputName] = useState("");
	const [name, setName] = useState("");
	const [token, setToken] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [roomList, setRoomList] = useState<string[]>([]);
	const [selectedRoom, setSelectedRoom] = useState("");
	const [newRoomName, setNewRoomName] = useState("");

	// Fetch the list of existing rooms when component mounts
	useEffect(() => {
		(async () => {
			try {
				const resp = await fetch("/api/get-room-list");
				const data = await resp.json();
				setRoomList(data.rooms);
			} catch (e) {
				console.error(e);
			}
		})();
	}, []);

	// Fetch token when name and room are set
	useEffect(() => {
		if (name !== "" && selectedRoom !== "") {
			setIsLoading(true);
			(async () => {
				try {
					const resp = await fetch(
						`/api/get-participant-token?room=${selectedRoom}&username=${name}`,
					);
					const data = await resp.json();
					setToken(data.token);
				} catch (e) {
					console.error(e);
				} finally {
					setIsLoading(false);
				}
			})();
		}
	}, [name, selectedRoom]);

	if (token === "") {
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
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100">
				<div className="bg-white p-8 rounded shadow-md w-full max-w-md">
					<h1 className="text-2xl font-semibold text-center mb-6">
						Enter your name to join a room
					</h1>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setName(inputName);
						}}
						className="space-y-4"
					>
						<input
							type="text"
							value={inputName}
							onChange={(e) => setInputName(e.target.value)}
							placeholder="Your name"
							className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
						<button
							type="submit"
							className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-200"
						>
							Next
						</button>
					</form>

					{name && (
						<div className="mt-8">
							<h2 className="text-xl font-semibold text-center mb-4">
								Select a room to join
							</h2>
							<select
								value={selectedRoom}
								onChange={(e) => setSelectedRoom(e.target.value)}
								className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">-- Select a room --</option>
								{roomList.map((room) => (
									<option key={room} value={room}>
										{room}
									</option>
								))}
							</select>
							<p className="mt-4 text-center">Or create a new room:</p>
							<div className="mt-2 flex">
								<input
									type="text"
									value={newRoomName}
									onChange={(e) => setNewRoomName(e.target.value)}
									placeholder="New room name"
									className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<button
									onClick={() => {
										if (newRoomName.trim() !== "") {
											setSelectedRoom(newRoomName.trim());
										}
									}}
									className="ml-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200"
									type="button"
								>
									Create and Join
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<LiveKitRoom
			video={true}
			audio={true}
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
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
	// `useTracks` returns all camera and screen share tracks.
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
