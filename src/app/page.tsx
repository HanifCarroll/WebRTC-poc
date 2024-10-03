"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
	const [inputName, setInputName] = useState("");
	const [name, setName] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const router = useRouter();

	const handleStartMeeting = () => {
		if (name.trim() === "") return;
		// Generate a unique meeting code (could use UUID or any unique identifier)
		const meetingCode = Math.random()
			.toString(36)
			.substring(2, 10)
			.toUpperCase();
		// Redirect to the meeting room with the meeting code
		router.push(`/room/${meetingCode}`);
	};

	const handleJoinMeeting = () => {
		if (joinCode.trim() === "") return;
		// Redirect to the meeting room with the provided meeting code
		router.push(`/room/${joinCode.trim()}`);
	};

	const handleSubmitName = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputName.trim() === "") return;
		setName(inputName);
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100">
			{!name ? (
				<div className="bg-white p-8 rounded shadow-md w-full max-w-md">
					<h1 className="text-2xl font-semibold text-center mb-6">
						Enter your name
					</h1>
					<form onSubmit={handleSubmitName} className="space-y-4">
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
				</div>
			) : (
				<div className="bg-white p-8 rounded shadow-md w-full max-w-md">
					<h1 className="text-2xl font-semibold text-center mb-6">
						Welcome, {name}!
					</h1>
					<div className="space-y-4">
						<button
							onClick={handleStartMeeting}
							className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition duration-200"
						>
							Start a New Meeting
						</button>
						<div className="mt-4">
							<h2 className="text-lg font-semibold text-center mb-2">
								Or Join an Existing Meeting
							</h2>
							<input
								type="text"
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value)}
								placeholder="Enter Meeting Code"
								className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onClick={handleJoinMeeting}
								className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-200"
							>
								Join Meeting
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
