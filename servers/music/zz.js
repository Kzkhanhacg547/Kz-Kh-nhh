const soundcloudDownloader = require("soundcloud-downloader").default;
const express = require("express");
const path = require("path");

// Using more intuitive endpoint naming
exports.name = "/kz-sound-portal";
exports.index = async (req, res, next) => {
  const data = req.query.data;

  // Display webview when no data parameter is provided
  if (!data) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kz Magical Sound Garden</title>
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Pacifico&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary-color: #8A2BE2;
            --secondary-color: #DA70D6;
            --accent-color: #FF69B4;
            --text-color: #FFFFFF;
            --dark-bg: #1A0033;
            --card-bg: rgba(106, 13, 173, 0.4);
            --gradient-start: #8A2BE2;
            --gradient-mid: #9370DB;
            --gradient-end: #DA70D6;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            background-color: var(--dark-bg);
            color: var(--text-color);
            font-family: 'Quicksand', sans-serif;
            line-height: 1.6;
            background-image: 
              radial-gradient(circle at 20% 20%, rgba(218, 112, 214, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(138, 43, 226, 0.2) 0%, transparent 50%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
          }

          .starry-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
          }

          .star {
            position: absolute;
            background: white;
            border-radius: 50%;
            opacity: 0;
            animation: twinkle 5s infinite;
          }

          @keyframes twinkle {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.8; }
          }

          .container {
            max-width: 800px;
            margin: 40px auto;
            padding: 30px;
            border-radius: 24px;
            position: relative;
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3),
                        0 0 20px rgba(218, 112, 214, 0.4);
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
          }

          .container::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            transform: rotate(30deg);
            z-index: -1;
          }

          .glow-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 24px;
            box-shadow: inset 0 0 20px rgba(255, 105, 180, 0.4);
            pointer-events: none;
            z-index: -1;
            animation: pulse 3s infinite alternate;
          }

          @keyframes pulse {
            0% { box-shadow: inset 0 0 20px rgba(255, 105, 180, 0.4); }
            100% { box-shadow: inset 0 0 40px rgba(255, 105, 180, 0.7); }
          }

          h1 {
            font-family: 'Pacifico', cursive;
            font-size: 2.8rem;
            text-align: center;
            margin-bottom: 1.5rem;
            color: white;
            text-shadow: 0 0 10px rgba(218, 112, 214, 0.8),
                         0 0 20px rgba(138, 43, 226, 0.5);
            position: relative;
            z-index: 1;
          }

          .title-decoration {
            position: relative;
            padding-bottom: 15px;
          }

          .title-decoration::after {
            content: "✨";
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 1.5rem;
          }

          .search-container {
            margin-top: 30px;
            position: relative;
            background: rgba(26, 0, 51, 0.6);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(218, 112, 214, 0.3);
          }

          .search-container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 20px;
            background: linear-gradient(45deg, 
                        rgba(138, 43, 226, 0.1), 
                        rgba(218, 112, 214, 0.1), 
                        rgba(255, 105, 180, 0.1));
            z-index: -1;
          }

          .input-group {
            position: relative;
            margin-bottom: 20px;
          }

          select, input[type="text"] {
            width: 100%;
            padding: 15px 20px;
            background: rgba(26, 0, 51, 0.8);
            border: 2px solid var(--secondary-color);
            border-radius: 50px;
            color: var(--text-color);
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
            font-family: 'Quicksand', sans-serif;
            box-shadow: 0 0 10px rgba(218, 112, 214, 0.3);
          }

          select {
            appearance: none;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23DA70D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
            background-repeat: no-repeat;
            background-position: right 20px center;
            padding-right: 50px;
            cursor: pointer;
          }

          select:focus, input[type="text"]:focus {
            border-color: var(--accent-color);
            box-shadow: 0 0 15px rgba(255, 105, 180, 0.5);
            transform: translateY(-2px);
          }

          input[type="text"]::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          .magic-btn {
            background: linear-gradient(45deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end));
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: block;
            width: 100%;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
            position: relative;
            overflow: hidden;
            font-family: 'Quicksand', sans-serif;
          }

          .magic-btn::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, 
                        rgba(255, 255, 255, 0) 0%, 
                        rgba(255, 255, 255, 0.1) 50%, 
                        rgba(255, 255, 255, 0) 100%);
            transform: translate(-100%, -100%) rotate(45deg);
            animation: shine 3s infinite;
          }

          @keyframes shine {
            0% { transform: translate(-100%, -100%) rotate(45deg); }
            100% { transform: translate(100%, 100%) rotate(45deg); }
          }

          .magic-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 7px 20px rgba(138, 43, 226, 0.6);
          }

          .magic-btn:active {
            transform: translateY(1px);
          }

          .status-message {
            margin-top: 15px;
            padding: 12px;
            border-radius: 50px;
            text-align: center;
            background: rgba(26, 0, 51, 0.7);
            border: 1px solid var(--secondary-color);
            display: none;
            font-weight: 500;
            box-shadow: 0 0 10px rgba(218, 112, 214, 0.3);
          }

          .spinner {
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--accent-color);
            animation: spin 1s ease-in-out infinite;
            vertical-align: middle;
            margin-right: 10px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .results-container {
            margin-top: 25px;
            background: rgba(26, 0, 51, 0.6);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid rgba(218, 112, 214, 0.3);
            max-height: 400px;
            overflow-y: auto;
            display: none;
            scrollbar-width: thin;
            scrollbar-color: var(--accent-color) rgba(26, 0, 51, 0.8);
          }

          .results-container::-webkit-scrollbar {
            width: 8px;
          }

          .results-container::-webkit-scrollbar-track {
            background: rgba(26, 0, 51, 0.8);
            border-radius: 10px;
          }

          .results-container::-webkit-scrollbar-thumb {
            background: var(--accent-color);
            border-radius: 10px;
          }

          .sound-card {
            background: rgba(138, 43, 226, 0.2);
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid rgba(218, 112, 214, 0.3);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          }

          .sound-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end));
          }

          .sound-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(138, 43, 226, 0.3);
          }

          .sound-title {
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 5px;
            color: white;
          }

          .sound-artist {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 10px;
          }

          .sound-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 15px;
          }

          .sound-actions {
            display: flex;
            gap: 10px;
          }

          .action-btn {
            padding: 10px 15px;
            border-radius: 50px;
            border: none;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            flex: 1;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Quicksand', sans-serif;
          }

          .play-btn {
            background: linear-gradient(45deg, #9370DB, #DA70D6);
            color: white;
          }

          .download-btn {
            background: linear-gradient(45deg, #8A2BE2, #9370DB);
            color: white;
          }

          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 3px 10px rgba(138, 43, 226, 0.4);
          }

          .action-btn:active {
            transform: translateY(1px);
          }

          .action-icon {
            margin-right: 5px;
            font-size: 1rem;
          }

          .player-box {
            margin-top: 25px;
            background: rgba(26, 0, 51, 0.7);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid rgba(218, 112, 214, 0.3);
            display: none;
          }

          .player-title {
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 15px;
            color: var(--accent-color);
            text-align: center;
            position: relative;
          }

          .player-title::before, .player-title::after {
            content: "✨";
            margin: 0 10px;
            font-size: 0.8rem;
          }

          audio {
            width: 100%;
            height: 40px;
            outline: none;
            border-radius: 50px;
            background: rgba(26, 0, 51, 0.9);
          }

          footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            position: relative;
          }

          .heart-decoration {
            display: inline-block;
            margin: 0 5px;
            animation: heartbeat 1.5s infinite;
            color: var(--accent-color);
          }

          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }

          .floating-item {
            position: absolute;
            pointer-events: none;
            opacity: 0.7;
            animation: float 10s infinite alternate ease-in-out;
          }

          .note-1 {
            top: 10%;
            left: 10%;
            font-size: 2rem;
            animation-delay: 0s;
            color: var(--accent-color);
          }

          .note-2 {
            top: 20%;
            right: 15%;
            font-size: 1.5rem;
            animation-delay: 2s;
            color: var(--secondary-color);
          }

          .note-3 {
            bottom: 15%;
            left: 15%;
            font-size: 1.8rem;
            animation-delay: 1.5s;
            color: var(--gradient-mid);
          }

          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
            100% { transform: translateY(10px) rotate(-10deg); }
          }

          .fade-in {
            animation: fadeIn 1s ease-out forwards;
            opacity: 0;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .sound-card {
            opacity: 0;
            animation: fadeIn 0.5s ease-out forwards;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .container {
              margin: 20px 15px;
              padding: 20px;
            }

            h1 {
              font-size: 2rem;
            }

            .sound-actions {
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <div class="starry-bg" id="starry-bg"></div>

        <div class="floating-item note-1">♪</div>
        <div class="floating-item note-2">♫</div>
        <div class="floating-item note-3">✨</div>

        <div class="container fade-in">
          <div class="glow-effect"></div>

          <div class="title-decoration">
            <h1>Kz Magical Sound Garden</h1>
          </div>

          <div class="search-container fade-in" style="animation-delay: 0.3s">
            <div class="input-group">
              <select id="action-type">
                <option value="search">✨ Find Magical Sounds</option>
                <option value="download">🎵 Download from URL</option>
              </select>
            </div>

            <div class="input-group">
              <input type="text" id="search-input" placeholder="Enter song name or SoundCloud URL..." />
            </div>

            <button id="search-btn" class="magic-btn">
              Discover Magic ✨
            </button>

            <div class="status-message" id="status-message"></div>
          </div>

          <div class="results-container" id="results-container"></div>

          <div class="player-box" id="player-box">
            <div class="player-title">Now Playing</div>
            <audio controls id="audio-player"></audio>
          </div>

          <footer class="fade-in" style="animation-delay: 0.6s">
            <div>Created with <span class="heart-decoration">♥</span> by Kz Community</div>
            <div>Magical Sound Garden • 2025</div>
          </footer>
        </div>

        <script>
          // Create starry background
          function createStarryBackground() {
            const container = document.getElementById('starry-bg');
            const starCount = 150;

            for (let i = 0; i < starCount; i++) {
              const star = document.createElement('div');
              star.className = 'star';

              // Random properties
              const size = Math.random() * 3 + 1;
              const posX = Math.random() * window.innerWidth;
              const posY = Math.random() * window.innerHeight;
              const delay = Math.random() * 5;
              const duration = Math.random() * 3 + 2;

              // Apply styles
              star.style.width = size + 'px';
              star.style.height = size + 'px';
              star.style.left = posX + 'px';
              star.style.top = posY + 'px';
              star.style.animationDelay = delay + 's';
              star.style.animationDuration = duration + 's';

              container.appendChild(star);
            }
          }

          // Initialize when page loads
          window.addEventListener('load', () => {
            createStarryBackground();

            // Enter key handler
            document.getElementById('search-input').addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                document.getElementById('search-btn').click();
              }
            });
          });

          // Handle search and download functionality
          document.getElementById('search-btn').addEventListener('click', async function() {
            const actionType = document.getElementById('action-type').value;
            const query = document.getElementById('search-input').value.trim();

            if (!query) {
              showStatus('Please enter a search term or URL 🎵', 'error');
              return;
            }

            const statusMsg = document.getElementById('status-message');
            const resultsContainer = document.getElementById('results-container');

            showStatus('<div class="spinner"></div> Finding magical sounds...', 'loading');

            if (actionType === 'search') {
              try {
                const response = await fetch(\`?data=\${encodeURIComponent(query)}\`);
                const data = await response.json();

                statusMsg.style.display = 'none';
                resultsContainer.style.display = 'block';

                if (data.collection && data.collection.length > 0) {
                  let html = '';

                  data.collection.forEach((track, index) => {
                    html += \`
                      <div class="sound-card" style="animation-delay: \${index * 0.1}s">
                        <div class="sound-title">\${track.title || 'Unknown Track'}</div>
                        <div class="sound-artist">\${track.user?.username || 'Unknown Artist'}</div>
                        <div class="sound-meta">
                          <span>\${track.formattedDuration || '∞'}</span>
                          <span>\${track.formattedDate || ''}</span>
                        </div>
                        <div class="sound-actions">
                          <button class="action-btn play-btn" data-url="\${track.permalink_url}" data-title="\${track.title || 'Unknown Track'}">
                            <span class="action-icon">▶</span> Play
                          </button>
                          <button class="action-btn download-btn" data-url="\${track.permalink_url}" data-title="\${track.title || 'Unknown Track'}">
                            <span class="action-icon">⬇</span> Download
                          </button>
                        </div>
                      </div>
                    \`;
                  });

                  resultsContainer.innerHTML = html;

                  // Add download button event listeners
                  document.querySelectorAll('.download-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                      const url = this.getAttribute('data-url');
                      const title = this.getAttribute('data-title');

                      showStatus('<div class="spinner"></div> Preparing your magical sound...', 'loading');

                      try {
                        // Force download mode
                        const response = await fetch(\`?data=\${encodeURIComponent(url)}&download=true\`);
                        const blob = await response.blob();

                        // Create download link
                        const downloadUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = \`\${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3\`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(downloadUrl);

                        showStatus('✨ Magic sound downloaded successfully!', 'success');
                        setTimeout(() => {
                          statusMsg.style.display = 'none';
                        }, 3000);
                      } catch (error) {
                        showStatus('✦ Oops! Magic fizzled. Try again.', 'error');
                      }
                    });
                  });

                  // Add play button event listeners
                  document.querySelectorAll('.play-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                      const url = this.getAttribute('data-url');
                      const title = this.getAttribute('data-title');
                      const playerBox = document.getElementById('player-box');
                      const player = document.getElementById('audio-player');

                      showStatus('<div class="spinner"></div> Tuning in to magical frequencies...', 'loading');

                      try {
                        // Create source URL for streaming
                        const audioUrl = \`?data=\${encodeURIComponent(url)}&stream=true\`;

                        player.src = audioUrl;
                        playerBox.style.display = 'block';
                        document.querySelector('.player-title').textContent = \`✨ \${title} ✨\`;

                        // Scroll to player
                      

                        player.play();
                        statusMsg.style.display = 'none';
                      } catch (error) {
                        showStatus('✦ Magic sound connection failed!', 'error');
                      }
                    });
                  });
                } else {
                  resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--accent-color);">No magical sounds found! Try another search ✨</div>';
                }
              } catch (error) {
                showStatus('✦ Search magic failed! Please try again.', 'error');
              }
            } else {
              // Direct download from URL
              try {
                const url = query;
                showStatus('<div class="spinner"></div> Capturing magical sound...', 'loading');

                // Direct download
                const response = await fetch(\`?data=\${encodeURIComponent(url)}&download=true\`);

                if (!response.ok) {
                  throw new Error('Download failed');
                }

                const blob = await response.blob();

                // Extract filename from URL or use default
                let filename = 'magical_sound';
                try {
                  filename = url.split('/').pop().split('?')[0] || filename;
                } catch (e) {}

                // Create download link
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = \`\${filename}.mp3\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);

                showStatus('✨ Magic sound captured successfully!', 'success');
                setTimeout(() => {
                  statusMsg.style.display = 'none';
                }, 3000);
              } catch (error) {
                showStatus('✦ Magic download failed! Check the URL.', 'error');
              }
            }
          });

          // Helper function to show status messages
          function showStatus(message, type) {
            const statusMsg = document.getElementById('status-message');
            statusMsg.innerHTML = message;
            statusMsg.style.display = 'block';

            // Apply status colors
            if (type === 'error') {
              statusMsg.style.borderColor = '#FF69B4';
              statusMsg.style.color = '#FF69B4';
            } else if (type === 'success') {
              statusMsg.style.borderColor = '#8A2BE2';
              statusMsg.style.color = '#DA70D6';
            } else {
              statusMsg.style.borderColor = '#DA70D6';
              statusMsg.style.color = 'white';
            }
          }

          // Add ambient glow effect
          function ambientGlowEffect() {
            const container = document.querySelector('.container');
            const glow = document.querySelector('.glow-effect');
            const intensity = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;

            if (glow) {
              glow.style.boxShadow = \`inset 0 0 \${20 + intensity * 15}px rgba(255, 105, 180, \${0.3 + intensity * 0.2})\`;
            }

            requestAnimationFrame(ambientGlowEffect);
          }

          ambientGlowEffect();
        </script>
      </body>
      </html>
    `);
  }

  // API processing section
  const downloadMode = req.query.download === "true";
  const streamMode = req.query.stream === "true";

  if (data.startsWith("http://") || data.startsWith("https://")) {
    // Download functionality for direct URLs
    try {
      const stream = await soundcloudDownloader.download(data);

      // Set appropriate headers for download/stream
      res.set("Content-Type", "audio/mpeg");

      if (downloadMode) {
        // Force browser to download as a file
        const info = await soundcloudDownloader.getInfo(data);
        const fileName = info.title
          ? encodeURIComponent(info.title.replace(/[^a-zA-Z0-9]/g, "_"))
          : "kz_magical_sound";
        res.set(
          "Content-Disposition",
          `attachment; filename="${fileName}.mp3"`
        );
      } else if (streamMode) {
        // For in-browser playing
        res.set("Content-Disposition", "inline");
      }

      // Pipe the audio stream to response
      stream.pipe(res);
    } catch (err) {
      res.status(500).send({
        error: err.message || "Download failed",
        message: "The magical connection was disrupted. Please try again.",
      });
    }
  } else {
    // Search functionality
    try {
      const info = await soundcloudDownloader.search({
        query: data,
        limit: 20, // Show more results
      });

      // Enhance results with more info
      if (info.collection && info.collection.length > 0) {
        info.collection = info.collection.map((track) => {
          // Format duration to minutes:seconds
          if (track.duration) {
            const minutes = Math.floor(track.duration / 60000);
            const seconds = Math.floor((track.duration % 60000) / 1000);
            track.formattedDuration = `${minutes}:${
              seconds < 10 ? "0" : ""
            }${seconds}`;
          }

          // Add formatted date
          if (track.created_at) {
            try {
              const date = new Date(track.created_at);
              track.formattedDate = date.toLocaleDateString();
            } catch (e) {
              track.formattedDate = "Unknown";
            }
          }

          return track;
        });
      }

      res.type("json").send(JSON.stringify(info, null, 2));
    } catch (err) {
      res.status(500).send({
        error: err.message || "Search failed",
        message: "Failed to find magical sounds. Please try again.",
      });
    }
  }
};

// Set up server with flexible routing
const app = express();
const routes = [
  "/kz-sound-portal",
  "/magic-sound",
  "/kz-music",
  "/sound-garden",
  "/",
];

// Register all route options
routes.forEach((route) => {
  app.get(route, exports.index);
  console.log(`Magical sound portal opened at: ${route}`);
});

// Add static file support
app.use(express.static(path.join(__dirname, "public")));

// Error handler
app.use((err, req, res, next) => {
  console.error("Magic disruption:", err);
  res.status(500).send(`
              <html>
              <head>
                <style>
                  body {
                    background: linear-gradient(135deg, #1A0033 0%, #330033 100%);
                    color: #FFFFFF;
                    font-family: 'Quicksand', sans-serif;
                    text-align: center;
                    padding: 50px 20px;
                    line-height: 1.6;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .container {
                    max-width: 500px;
                    padding: 30px;
                    background: rgba(138, 43, 226, 0.2);
                    border-radius: 20px;
                    border: 2px solid rgba(218, 112, 214, 0.3);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3),
                                0 0 20px rgba(218, 112, 214, 0.4);
                  }
                  h1 {
                    color: #FF69B4;
                    font-size: 2rem;
                    margin-bottom: 20px;
                  }
                  p {
                    margin-bottom: 20px;
                  }
                  a {
                    display: inline-block;
                    background: linear-gradient(45deg, #8A2BE2, #DA70D6);
                    color: white;
                    text-decoration: none;
                    padding: 12px 25px;
                    border-radius: 50px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
                  }
                  a:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 7px 20px rgba(138, 43, 226, 0.6);
                  }
                  .sparkle {
                    display: inline-block;
                    margin: 0 5px;
                  }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet">
              </head>
              <body>
                <div class="container">
                  <h1><span class="sparkle">✨</span> Magic Disruption <span class="sparkle">✨</span></h1>
                  <p>The magical connection has been temporarily lost.</p>
                  <p>Let's try again!</p>
                  <a href="/kz-sound-portal">Return to Sound Garden</a>
                </div>
              </body>
              </html>
  `);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✨ Kz Magical Sound Garden blooming on port ${port} ✨`);
  console.log(`✨ Ready to channel magical sounds ✨`);
});
