
import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import VideoRecorder from './VideoRecorder'

const apiCall = () => {
	axios.get("http://localhost:8080").then((data) => {
		console.log(data);
	});
};

function App() {
	return (
		<>
			<div className="text-center">
				<button onClick={apiCall}>Make API Call</button>
				<VideoRecorder />
			</div>
		</>
	);
}

export default App;
