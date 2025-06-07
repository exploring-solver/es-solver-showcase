const https = require('https');

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ API key is required. Pass it as a command-line argument or set GEMINI_API_KEY env variable.");
  process.exit(1);
}

const data = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: "Explain how AI works in a few words"
        }
      ]
    }
  ]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let responseData = '';

  res.on('data', chunk => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log("✅ Response:");
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("❌ Failed to parse response:", err);
    }
  });
});

req.on('error', error => {
  console.error("❌ Request error:", error);
});

req.write(data);
req.end();
