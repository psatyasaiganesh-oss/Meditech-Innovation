const { GoogleGenerativeAI } = require("@google/genai");

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.AIzaSyB8tiw-hFRJ-lROYXxQ7GjD_DMt_NSltlk);

async function run(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}

// Call this function from your server-side endpoint
// For example, using Express.js:
// app.post('/api/generate', async (req, res) => {
//   const { prompt } = req.body;
//   const response = await run(prompt);
//   res.json({ text: response });
// });