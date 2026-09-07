const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.rewriteContent = async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Text is required for rewriting' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      const polishedFallback =
        type === 'bio'
          ? 'Passionate software engineer crafting resilient applications, modern systems, and innovative digital solutions.'
          : 'Delighted to share our recent project milestones and breakthroughs with the OrbitPro community!';
      return res.json({ rewritten: polishedFallback });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional networking writing assistant. Professionally rewrite the following ${
      type || 'text'
    } to make it sound polished, compelling, concise, and under 200 characters. Return ONLY the rewritten text without quotation marks or explanations:\n\n"${text.trim()}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rewritten = response.text().trim();

    if (rewritten.startsWith('"') && rewritten.endsWith('"')) {
      rewritten = rewritten.slice(1, -1);
    }

    if (rewritten.length > 200) {
      rewritten = rewritten.substring(0, 197) + '...';
    }

    res.json({ rewritten });
  } catch (err) {
    console.error('Gemini rewrite error:', err.message);
    res.status(500).json({ message: 'AI rewriting failed', error: err.message });
  }
};
