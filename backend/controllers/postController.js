const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await Post.create({
      author: req.user.id,
      content: content.trim(),
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name')
      .populate('comments.author', 'name');

    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name')
      .populate('comments.author', 'name');

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const isLiked = post.likes.some((uid) => uid.toString() === userId);

    if (isLiked) {
      post.likes = post.likes.filter((uid) => uid.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name')
      .populate('comments.author', 'name');

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author: req.user.id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name')
      .populate('comments.author', 'name');

    res.status(201).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
