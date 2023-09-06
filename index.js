const youtubeLinkInput = document.getElementById("youtube-link");
const playButton = document.getElementById("play-button");
const audioPlayer = document.getElementById("audio-player");
const visualizer = document.getElementById("visualizer");
const ctx = visualizer.getContext("2d");
let audioContext, source, analyzer;

function initializeAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyzer = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    analyzer.fftSize = 256;
}

playButton.addEventListener("click", () => {
    const youtubeLink = youtubeLinkInput.value.trim();
    if (youtubeLink) {
        initializeAudioContext();

        const videoId = getVideoIdFromLink(youtubeLink);
        if (videoId) {
            const audioStreamUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=YOUR_API_KEY`;

            fetch(audioStreamUrl)
                .then((response) => response.json())
                .then((data) => {
                    if (data.items && data.items.length > 0) {
                        const duration = parseDuration(data.items[0].contentDetails.duration);
                        audioPlayer.src = `https://www.youtube.com/watch?v=${videoId}&t=${duration}s`;
                        audioPlayer.style.display = "block";
                        visualizer.style.display = "block";

                        audioPlayer.play().then(() => {
                            source = audioContext.createMediaElementSource(audioPlayer);
                            source.connect(analyzer);
                            analyzer.connect(audioContext.destination);
                            visualize();
                        });
                    } else {
                        alert("Unable to retrieve audio stream.");
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } else {
            alert("Invalid YouTube link.");
        }
    }
});

function getVideoIdFromLink(link) {
    const regex = /[?&]v=([^&]+)/;
    const match = link.match(regex);
    return match && match[1] ? match[1] : null;
}

function parseDuration(durationString) {
    const matches = durationString.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

function visualize() {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, visualizer.width, visualizer.height);

    const barWidth = (visualizer.width / bufferLength) * 2.5;
    let x = 0;

    dataArray.forEach((value) => {
        const barHeight = (value / 256) * visualizer.height;
        ctx.fillStyle = `rgb(50, 50, ${value + 100})`;
        ctx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    });

    requestAnimationFrame(visualize);
}
