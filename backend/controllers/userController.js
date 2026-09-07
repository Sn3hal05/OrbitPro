const User = require('../models/User');
const cosineSimilarity = require('../utils/cosineSimilarity');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateEmbedding(text) {
  if (!text || !text.trim()) return [];
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text.trim());
      if (result && result.embedding && result.embedding.values) {
        return result.embedding.values;
      }
    } catch (err) {
      console.warn('Gemini embedding failed, falling back to local deterministic embedding:', err.message);
    }
  }

  // Deterministic normalized embedding vector fallback (32 dimensions)
  const vector = new Array(32).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const idx = (charCode * (i + 1) + w) % 32;
      vector[idx] += 1;
    }
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vector.map((v) => v / norm) : vector;
}

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'You can only edit your own profile' });
    }

    const { name, bio, skills } = req.body;
    const updateData = { name, bio, skills };

    // Regenerate embedding whenever bio or skills changes
    if (bio !== undefined || skills !== undefined) {
      const existingUser = await User.findById(req.params.id);
      const newBio = bio !== undefined ? bio : existingUser.bio;
      const newSkills = skills !== undefined ? skills : existingUser.skills;
      const textToEmbed = `${newBio || ''} ${(Array.isArray(newSkills) ? newSkills : []).join(' ')}`.trim();
      if (textToEmbed) {
        updateData.embedding = await generateEmbedding(textToEmbed);
      } else {
        updateData.embedding = [];
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure target user has embedding computed if bio or skills exist
    if (!targetUser.embedding || targetUser.embedding.length === 0) {
      const textToEmbed = `${targetUser.bio || ''} ${(targetUser.skills || []).join(' ')}`.trim();
      if (textToEmbed) {
        targetUser.embedding = await generateEmbedding(textToEmbed);
        await targetUser.save();
      } else {
        return res.json([]);
      }
    }

    // Loop over all other users with a non-empty embedding
    const otherUsers = await User.find({
      _id: { $ne: targetUser._id },
      'embedding.0': { $exists: true },
    }).select('name bio skills embedding');

    const scoredUsers = otherUsers.map((user) => {
      const similarity = cosineSimilarity(targetUser.embedding, user.embedding);
      return {
        _id: user._id,
        name: user.name,
        bio: user.bio,
        skills: user.skills,
        similarity,
      };
    });

    // Sort descending by similarity
    scoredUsers.sort((a, b) => b.similarity - a.similarity);

    // Return top 5-10 with basic info (name, bio, skills)
    const recommendations = scoredUsers.slice(0, 10).map(({ _id, name, bio, skills }) => ({
      _id,
      name,
      bio,
      skills,
    }));

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};