import Complaint from '../models/Complaint.js';

export const createComplaint = async (req, res) => {
  const { subject, message } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  try {
    const complaint = await Complaint.create({
      user: req.user._id,
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
