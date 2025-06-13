const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const ytdlp = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:3000', // change if deploying
}));

app.use(basicAuth({
  users: { 'admin': 'yourpassword' },
  challenge: true,
}));

app.get('/api/download', (req, res) => {
  const videoURL = req.query.url;
  if (!videoURL) {
    return res.status(400).send('Missing URL');
  }

  const process = ytdlp.exec(videoURL, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    args: ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4', '-o', '-'],
  });

  res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
  res.setHeader('Content-Type', 'video/mp4');

  process.stdout.pipe(res);

  process.stderr.on('data', (data) => {
    console.error('yt-dlp error:', data.toString());
  });

  process.on('error', (err) => {
    console.error('yt-dlp execution failed:', err);
    res.status(500).send('Failed to download video.');
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.error(`yt-dlp exited with code ${code}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
