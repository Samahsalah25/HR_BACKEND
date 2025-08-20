const express = require('express');
const router = express.Router();
const {
  upload,
  getAlltasks,
  createTasks,
  taskByemployee,
  updateTask,
  deleteTask,getTaskById,
  tasksOverview
} = require('../controllers/tasksController');
const authenticate = require('../middlesware/authenticate');

// Routes
router.get('/', authenticate, getAlltasks);
router.get('/tasksOverview', authenticate, tasksOverview);
router.get('/taskbyemployee/:id', authenticate, taskByemployee);
router.get('/:id',authenticate ,getTaskById)

router.post('/', authenticate,upload.single('attachments'), createTasks);
router.patch('/:id', authenticate, upload.single('attachments'), updateTask);
router.delete('/:id', authenticate, deleteTask);

module.exports = router;
