const Schedule = require('../models/Schedule');

/**
 * Creates Google Calendar URL template for client-side clicks
 */
const getGoogleCalendarUrl = (schedule) => {
  const title = `InterviewAI Pro: ${schedule.type} Mock Interview (${schedule.companyName})`;
  const details = `Get ready for your AI-evaluated mock round at InterviewAI Pro.\nNotes: ${schedule.notes || 'None'}\n\nStart practicing at: http://localhost:5173/mock-interview`;
  
  const start = new Date(schedule.scheduledDate);
  const end = new Date(start.getTime() + (schedule.durationMinutes || 30) * 60 * 1000);

  // Format date to UTC: YYYYMMDDTHHmmSSZ
  const formatUTC = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = `${formatUTC(start)}/${formatUTC(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}`;
};

// 1. Create a Scheduled Mock Session
const createSchedule = async (req, res, next) => {
  try {
    const { companyName, type, scheduledDate, durationMinutes, notes } = req.body;
    if (!companyName || !type || !scheduledDate) {
      return res.status(400).json({ message: 'Company name, type, and scheduled date are required' });
    }

    const schedule = await Schedule.create({
      userId: req.user._id,
      companyName,
      type,
      scheduledDate,
      durationMinutes: durationMinutes || 30,
      notes: notes || ''
    });

    const googleCalendarUrl = getGoogleCalendarUrl(schedule);

    res.status(201).json({
      message: 'Interview round successfully scheduled in calendar tracker.',
      schedule,
      googleCalendarUrl
    });

  } catch (error) {
    next(error);
  }
};

// 2. Get User's Scheduled Mock Sessions
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id })
      .sort({ scheduledDate: 1 });

    // Map Google Calendar Links dynamically
    const mapped = schedules.map(s => ({
      ...s.toObject(),
      googleCalendarUrl: getGoogleCalendarUrl(s)
    }));

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

// 3. Cancel a Scheduled Session
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!schedule) {
      return res.status(404).json({ message: 'Scheduled slot not found' });
    }
    res.status(200).json({ message: 'Scheduled mock slot successfully cancelled.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  deleteSchedule
};
