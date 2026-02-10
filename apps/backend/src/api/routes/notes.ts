import { Router } from 'express';
import { NotesAPIController } from '../controllers/NotesAPIController';
import { authMiddleware } from '../../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const notesController = new NotesAPIController();

// Setup multer for PDF uploads
const uploadsRoot = path.join(__dirname, '../../../uploads');
const tmpDir = path.join(uploadsRoot, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
});

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.get('/', (req, res) => notesController.list(req, res));
router.post('/', (req, res) => notesController.create(req, res));
router.get('/:id', (req, res) => notesController.get(req, res));
router.put('/:id', (req, res) => notesController.update(req, res));
router.delete('/:id', (req, res) => notesController.delete(req, res));

// Yjs document snapshot
router.get('/:id/snapshot', (req, res) => notesController.getSnapshot(req, res));

// Sharing
router.post('/:id/share', (req, res) => notesController.share(req, res));

// PDF backgrounds upload
router.post(
  '/:id/pdf-backgrounds',
  upload.single('file'),
  (req, res) => notesController.uploadPdfBackgrounds(req, res)
);

export default router;
