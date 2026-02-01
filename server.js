const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Cloud Run은 process.env.PORT를 제공합니다 (기본 8080)
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || '';

const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

console.log(`Starting server...`);
console.log(`Serving static files from: ${DIST_DIR}`);

// dist 폴더가 존재하는지 확인 (디버깅용)
if (!fs.existsSync(DIST_DIR)) {
  console.error(`CRITICAL ERROR: Directory not found: ${DIST_DIR}`);
  console.error('Make sure "npm run build" was executed successfully in the Dockerfile.');
}

// 정적 파일 서빙
app.use(express.static(DIST_DIR));

// SPA 라우팅 및 API Key 주입
app.get('*', (req, res) => {
  fs.readFile(INDEX_PATH, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Server Error: index.html not found');
    }

    // index.html 내의 플레이스홀더를 실제 환경 변수로 교체
    const injectedHtml = htmlData.replace(
      '__API_KEY_PLACEHOLDER__',
      API_KEY
    );

    res.send(injectedHtml);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Core Dental Server running on port ${PORT}`);
});