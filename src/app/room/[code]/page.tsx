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
import { useEffect, useState } from "react";

export default function RoomPage({ params }: { params: { code: string } }) {
	const [username, setUsername] = useState<string | null>(null);
	const [usernameInput, setUsernameInput] = useState("");
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

	const meetingCode = params.code.trim().toUpperCase();

	useEffect(() => {
		// Check camera permissions when the component mounts
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

	/**
	 * Initiates the process to join the meeting by checking for a stored username.
	 * If a username exists in session storage, it uses that to fetch a token.
	 * Otherwise, it prompts the user to enter a username.
	 */
	const initiateJoin = () => {
		const storedUsername = sessionStorage.getItem(`username_${meetingCode}`);
		if (storedUsername) {
			setUsername(storedUsername);
			fetchToken(storedUsername);
		} else {
			setShowUsernamePrompt(true);
		}
	};

	/**
	 * Fetches an authentication token from the server for the given username and meeting code.
	 * Handles loading state and error alerts based on the response.
	 * 
	 * @param username - The username of the participant
	 */
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

	/**
	 * Handles the submission of the username form.
	 * Fetches a token using the entered username and stores it in session storage.
	 * 
	 * @param e - The form submission event
	 */
	const handleJoin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (usernameInput.trim() === "") return;

		await fetchToken(usernameInput.trim());
		// Store the username to avoid prompting again in the same session
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
		<div className="h-screen flex flex-col">
			{token && username && (
				<LiveKitRoom
					video={true}
					audio={true}
					token={token}
					serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ""}
					data-lk-theme="default"
					className="flex flex-col h-full w-full"
				>
					<RoomAudioRenderer />
					<div className="flex-1 overflow-hidden">
						<VideoUI />
					</div>
					<div className="h-16 md:h-18 flex-shrink-0">
						<ControlBar className="h-full" />
					</div>
				</LiveKitRoom>
			)}
		</div>
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

	const [isLocalPortrait, setIsLocalPortrait] = useState(false);
	const [isRemotePortrait, setIsRemotePortrait] = useState(false);

	useEffect(() => {
		if (localParticipantVideoTrack) {
			const videoTrack =
				localParticipantVideoTrack.publication?.track?.mediaStreamTrack;
			if (videoTrack) {
				const { width, height } = videoTrack.getSettings();
				if (width && height) {
					setIsLocalPortrait(height > width);
				}
			}
		}
	}, [localParticipantVideoTrack]);

	useEffect(() => {
		if (remoteParticipantVideoTracks.length > 0) {
			const videoTrack =
				remoteParticipantVideoTracks[0].publication?.track?.mediaStreamTrack;
			if (videoTrack) {
				const { width, height } = videoTrack.getSettings();
				if (width && height) {
					setIsRemotePortrait(height > width);
				}
			}
		}
	}, [remoteParticipantVideoTracks]);

	if (!localParticipantVideoTrack) {
		return null;
	}

	return (
		<div
			id="video-container"
			className="relative h-full bg-black overflow-hidden"
		>
			{remoteCount === 0 && (
				<div id="local-video-wrapper" className="w-full h-full">
					<VideoTrack
						id="local-video-track"
						trackRef={localParticipantVideoTrack}
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			{remoteCount > 0 && (
				<div className="flex h-full">
					<div
						id="remote-video-wrapper"
						className={`flex-1 flex items-center justify-center ${
							isRemotePortrait ? "pl-4 pr-2" : "pl-2 pr-4"
						}`}
					>
						<VideoTrack
							id="remote-video-track"
							trackRef={remoteParticipantVideoTracks[0]}
							className={`w-full h-full ${
								isRemotePortrait ? "object-contain" : "object-cover"
							}`}
						/>
					</div>
					<div
						id="local-video-pip"
						className={`
							absolute bottom-4 right-4 
							${isLocalPortrait ? "w-24 h-32 md:w-32 md:h-48" : "w-32 h-24 md:w-48 md:h-32"} 
							z-10
						`}
					>
						<VideoTrack
							id="local-video-track-pip"
							trackRef={localParticipantVideoTrack}
							className="w-full h-full object-cover rounded-md shadow-lg"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
