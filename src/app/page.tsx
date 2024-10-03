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
			return <div>Getting token...</div>;
		}
		return (
			<div style={{ padding: "20px", textAlign: "center" }}>
				<h1>Enter your name to join a room</h1>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						setName(inputName);
					}}
				>
					<input
						type="text"
						value={inputName}
						onChange={(e) => setInputName(e.target.value)}
						placeholder="Your name"
						style={{ padding: "10px", fontSize: "16px", width: "200px" }}
						required
					/>
					<button
						type="submit"
						style={{
							padding: "10px 20px",
							marginLeft: "10px",
							fontSize: "16px",
						}}
					>
						Next
					</button>
				</form>

				{name && (
					<div style={{ marginTop: "30px" }}>
						<h2>Select a room to join</h2>
						<div>
							<select
								value={selectedRoom}
								onChange={(e) => setSelectedRoom(e.target.value)}
								style={{ padding: "10px", fontSize: "16px", width: "220px" }}
							>
								<option value="">-- Select a room --</option>
								{roomList.map((room) => (
									<option key={room} value={room}>
										{room}
									</option>
								))}
							</select>
						</div>
						<p style={{ marginTop: "20px" }}>Or create a new room:</p>
						<div>
							<input
								type="text"
								value={newRoomName}
								onChange={(e) => setNewRoomName(e.target.value)}
								placeholder="New room name"
								style={{ padding: "10px", fontSize: "16px", width: "200px" }}
							/>
							<button
								onClick={() => {
									if (newRoomName.trim() !== "") {
										setSelectedRoom(newRoomName.trim());
									}
								}}
								style={{
									padding: "10px 20px",
									marginLeft: "10px",
									fontSize: "16px",
								}}
								type="button"
							>
								Create and Join
							</button>
						</div>
					</div>
				)}
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
			style={{ height: "100dvh" }}
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
			style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
		>
			<ParticipantTile />
		</GridLayout>
	);
}
