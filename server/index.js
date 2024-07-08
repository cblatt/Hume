const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });

const HUME_API_URL = "https://api.hume.ai/v0/batch/jobs";
const API_KEY = "26H86YGSfbIl1or7Xv5klqSdPEBLWGA9mX5cXnAooTTuzSzr";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Hello from our server!");
});

// Simple test endpoint
app.get("/api/test", (req, res) => {
	console.log("Test endpoint hit");
	res.json({ message: "Backend is working" });
});

app.post("/api/upload", upload.single("video"), async (req, res) => {
	try {
		console.log("File uploaded:", req.file);

		const videoPath = path.join(__dirname, req.file.path);
		console.log("Video path:", videoPath);

		// Upload the video file to Hume.ai
		const form = new FormData();
		form.append("file", fs.createReadStream(videoPath));
		form.append(
			"json",
			JSON.stringify({
				models: {
					face: {},
					prosody: {},
					burst: {},
				},
			})
		);

		const uploadResponse = await axios.post(HUME_API_URL, form, {
			headers: {
				"X-Hume-Api-Key": API_KEY,
				...form.getHeaders(),
			},
		});

		console.log("Upload response:", uploadResponse.data);

		const jobId = uploadResponse.data.job_id;
		if (!jobId) {
			throw new Error("Job ID not found in the response.");
		}
		console.log("Job ID:", jobId);

		// Polling Hume.ai for results
		let result;
		while (true) {
			const statusResponse = await axios.get(`${HUME_API_URL}/${jobId}`, {
				headers: {
					"X-Hume-Api-Key": API_KEY,
				},
			});
			result = statusResponse.data;
			console.log("Polling result:", result);
			if (result.state.status === "COMPLETED") {
				break;
			}
			if (result.state.status === "FAILED") {
				return res.status(500).json({ error: "Analysis failed" });
			}
			await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
		}

		// Fetching predictions
		const predictionResponse = await axios.get(`${HUME_API_URL}/${jobId}/predictions`, {
			headers: {
				"X-Hume-Api-Key": API_KEY,
			},
		});

		console.log("Full analysis result:", JSON.stringify(predictionResponse.data, null, 2));

		// Send the full prediction response to the frontend
		res.json(predictionResponse.data);
	} catch (error) {
		if (error.response) {
			console.error("Error response data:", error.response.data);
			console.error("Error response status:", error.response.status);
			console.error("Error response headers:", error.response.headers);
		} else if (error.request) {
			console.error("Error request data:", error.request);
		} else {
			console.error("Error message:", error.message);
		}
		res.status(500).json({ error: "An error occurred during processing." });
	}
});

app.listen(8080, () => {
	console.log("Server listening on port 8080");
});
