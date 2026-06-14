const Review = require("../models/Review");

exports.addReview = async (req, res) => {
  try {
    const review = await Review.create({
      userId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("userId");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const ownsReview = String(review.userId) === req.user.id;
    if (req.user.role !== "admin" && !ownsReview) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedReview = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("userId");
    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const ownsReview = String(review.userId) === req.user.id;
    if (req.user.role !== "admin" && !ownsReview) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
