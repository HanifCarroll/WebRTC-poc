"use client";

import {
	ControlBar,
	LiveKitRoom,
	RoomAudioRenderer,
	type TrackReference,
	VideoTrack,
	useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomPage({ params }: { params: { code: string } }) {
	const [username, setUsername] = useState<string | null>(null);
	const [usernameInput, setUsernameInput] = useState("");
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

	const meetingCode = params.code.trim().toUpperCase();

	useEffect(() => {
		// Check camera permissions
		navigator.permissions
			.query({ name: "camera" as PermissionName })
			.then((result) => {
				if (result.state === "granted") {
					initiateJoin();
				} else if (result.state === "prompt") {
					setShowUsernamePrompt(true);
				} else {
					// Permission denied
					alert(
						"Camera access denied. Please enable it in your browser settings to join the meeting.",
					);
				}

				// Listen for changes in permission state
				result.onchange = () => {
					if (result.state === "granted") {
						initiateJoin();
					} else if (result.state === "denied") {
						alert(
							"Camera access denied. Please enable it in your browser settings to join the meeting.",
						);
					}
				};
			});
	}, []);

	const initiateJoin = () => {
		const storedUsername = sessionStorage.getItem(`username_${meetingCode}`);
		if (storedUsername) {
			setUsername(storedUsername);
			fetchToken(storedUsername);
		} else {
			setShowUsernamePrompt(true);
		}
	};

	const fetchToken = async (username: string) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/get-participant-token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ room: meetingCode, username: username.trim() }),
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

	const handleJoin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (usernameInput.trim() === "") return;

		await fetchToken(usernameInput.trim());
		// Store the username in sessionStorage
		sessionStorage.setItem(`username_${meetingCode}`, usernameInput.trim());
		setUsername(usernameInput.trim());
	};

	if (isLoading || (token && !username)) {
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

	if (showUsernamePrompt && !username) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100">
				<div className="bg-white p-8 rounded shadow-md w-full max-w-md">
					<h1 className="text-2xl font-semibold text-center mb-6">
						Enter your username
					</h1>
					<form onSubmit={handleJoin} className="space-y-4">
						<input
							type="text"
							value={usernameInput}
							onChange={(e) => setUsernameInput(e.target.value)}
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
		<>
			{token && username && (
				<LiveKitRoom
					video={true}
					audio={true}
					token={token}
					serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ""}
					data-lk-theme="default"
					className="h-screen"
					onConnected={() => console.log("Connected to LiveKit Room")}
					onDisconnected={() => console.log("Disconnected from LiveKit Room")}
					onError={(error) => {
						console.error("LiveKitRoom Error:", error);
						alert("An error occurred with the LiveKit Room.");
					}}
				>
					<VideoUI />
					<RoomAudioRenderer />
					<ControlBar />
				</LiveKitRoom>
			)}
		</>
	);
}

function VideoUI() {
	const trackReferences: TrackReference[] = useTracks([Track.Source.Camera]);
	const localParticipantVideoTrack = trackReferences.find(
		(track) => track.participant.isLocal,
	);
	const remoteParticipantVideoTracks = trackReferences.filter(
		(track) => !track.participant.isLocal,
	);

	const remoteCount = remoteParticipantVideoTracks.length;

	if (!localParticipantVideoTrack) {
		return null;
	}

	if (remoteCount === 0) {
		return (
			<div className="relative flex h-screen">
				<VideoTrack
					trackRef={localParticipantVideoTrack}
					className="w-full h-full object-cover"
				/>
			</div>
		);
	}

	if (remoteCount === 1) {
		const remoteTrack = remoteParticipantVideoTracks[0];

		return (
			<div className="relative flex h-screen">
				<div className="w-full h-full">
					<VideoTrack
						trackRef={remoteTrack}
						className="w-full h-full object-cover"
					/>
				</div>
				<div className="absolute bottom-4 right-4 w-48 h-36">
					<VideoTrack
						trackRef={localParticipantVideoTrack}
						className="w-full h-full object-cover rounded-md shadow-lg"
					/>
				</div>
			</div>
		);
	}

	return null;
}
