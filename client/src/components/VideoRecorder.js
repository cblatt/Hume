import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const VideoRecorder = () => {
	const webcamRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const [recordedChunks, setRecordedChunks] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [recording, setRecording] = useState(false);
	const [videoURL, setVideoURL] = useState(null);
	const [results, setResults] = useState(null); // State to store the results

	const handleStartCaptureClick = useCallback(() => {
		if (webcamRef.current && webcamRef.current.video) {
			const stream = webcamRef.current.video.srcObject;
			mediaRecorderRef.current = new MediaRecorder(stream, {
				mimeType: "video/webm",
			});

			mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
				if (event.data.size > 0) {
					setRecordedChunks((prev) => prev.concat(event.data));
				}
			});

			mediaRecorderRef.current.start();
			setRecording(true);
		}
	}, [webcamRef, mediaRecorderRef, setRecording, setRecordedChunks]);

	const handleStopCaptureClick = useCallback(() => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			setRecording(false);
		}
	}, [mediaRecorderRef, setRecording]);

	useEffect(() => {
		if (!recording && recordedChunks.length > 0) {
			const blob = new Blob(recordedChunks, { type: "video/webm" });
			const url = URL.createObjectURL(blob);
			setVideoURL(url);
		}
	}, [recording, recordedChunks]);

	const handleUploadClick = useCallback(() => {
		if (recordedChunks.length) {
			setUploading(true);
			const blob = new Blob(recordedChunks, { type: "video/webm" });
			const formData = new FormData();
			formData.append("video", blob);

			axios
				.post(`${process.env.REACT_APP_API_URL}/api/upload`, formData, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				})
				.then((response) => {
					console.log(response.data);
					setResults(response.data); // Store the results in the state
					setUploading(false);
				})
				.catch((error) => {
					console.error("Error during upload:", error);
					setUploading(false);
				});
		}
	}, [recordedChunks]);

	return (
		<div>
			<Webcam audio={true} ref={webcamRef} muted={true} />
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center"
				}}>
				<div style={{ display: "flex", justifyContent: "space-between", width: "30%" }}>
					<button
						className="btn btn-primary"
						onClick={handleStartCaptureClick}
						disabled={recording}>
						{recording ? "Recording..." : "Start Capture"}
					</button>
					<button className="btn btn-primary" onClick={handleStopCaptureClick} disabled={!recording}>
						Stop Capture
					</button>
					<button className="btn btn-primary" onClick={handleUploadClick} disabled={uploading || recording}>
						{uploading ? "Uploading..." : "Upload"}
					</button>
				</div>
			</div>

			{videoURL && (
				<div>
					<h3>Recorded Video:</h3>
					<video src={videoURL} controls />
				</div>
			)}
			{results && (
				<div>
					<h3>Analysis Results:</h3>
					<pre>{JSON.stringify(results, null, 2)}</pre>
				</div>
			)}
		</div>
	);
};

export default VideoRecorder;
