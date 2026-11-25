const router = require('express').Router();
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Get feed posts (public + role-based for user's role)
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = {
      $or: [
        { visibility: 'public' },
        { visibility: 'role_based', targetRoles: req.user.role },
        { visibility: 'private', targetUsers: req.user._id },
        { author: req.user._id }
      ]
    };
    const posts = await Post.find(query)
      .populate('author', 'name role department avatar')
      .populate('comments.author', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Post.countDocuments(query);
    res.json({ posts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create post
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { content, visibility, targetRoles, targetUsers, category, tags } = req.body;
    const media = (req.files || []).map(f => ({
      url: `/uploads/${f.filename}`,
      type: f.mimetype.startsWith('video') ? 'video' : 'image'
    }));
    const post = await Post.create({
      author: req.user._id,
      content,
      media,
      visibility: visibility || 'public',
      targetRoles: targetRoles ? JSON.parse(targetRoles) : [],
      targetUsers: targetUsers ? JSON.parse(targetUsers) : [],
      category: category || 'general',
      tags: tags ? JSON.parse(tags) : []
    });
    await post.populate('author', 'name role department avatar');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/Unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.includes(req.user._id);
    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          content: `${req.user.name} liked your post`,
          relatedPost: post._id
        });
      }
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ author: req.user._id, content: req.body.content });
    await post.save();
    await post.populate('comments.author', 'name avatar');
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pin/Unpin (HoD, Principal, Admin)
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const allowedRoles = ['hod', 'principal', 'admin'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const post = await Post.findByIdAndUpdate(req.params.id, { isPinned: !req.params.pinned }, { new: true });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
