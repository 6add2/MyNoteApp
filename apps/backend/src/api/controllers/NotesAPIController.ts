import type { Request, Response } from 'express';
import { Note, Workspace } from '../../models';
import mongoose from 'mongoose';
import { convertPdfToImages } from '../../services/pdfService';

export class NotesAPIController {
  /**
   * GET /api/notes
   * List all notes for the current user
   */
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      // Find notes where user is owner or has permissions
      const notes = await Note.find({
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId },
        ],
      })
        .sort({ 'metadata.updatedAt': -1 })
        .select('-yDocSnapshot'); // Don't include the full document

      res.json({ notes });
    } catch (error) {
      console.error('List notes error:', error);
      res.status(500).json({ error: 'Failed to list notes' });
    }
  }

  /**
   * POST /api/notes
   * Create a new note
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { title, workspaceId } = req.body;

      // Validate workspace
      let workspace;
      if (workspaceId) {
        workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
          res.status(404).json({ error: 'Workspace not found' });
          return;
        }
      } else {
        // Use user's default workspace or create one
        workspace = await Workspace.findOne({ ownerId: userId });
        if (!workspace) {
          workspace = new Workspace({
            name: 'Personal Notes',
            ownerId: userId,
            memberIds: [userId],
          });
          await workspace.save();
        }
      }

      const note = new Note({
        title: title || 'Untitled Note',
        ownerId: userId,
        workspaceId: workspace._id,
        permissions: [{ userId, role: 'owner' }],
      });

      await note.save();

      res.status(201).json({ note });
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  }

  /**
   * GET /api/notes/:id
   * Get a specific note
   */
  public async get(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid note ID' });
        return;
      }

      const note = await Note.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId },
          { isPublic: true },
        ],
      }).select('-yDocSnapshot');

      if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }

      res.json({ note });
    } catch (error) {
      console.error('Get note error:', error);
      res.status(500).json({ error: 'Failed to get note' });
    }
  }

  /**
   * PUT /api/notes/:id
   * Update a note
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { title, tags, isPublic, backgroundUrl } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid note ID' });
        return;
      }

      const note = await Note.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId, 'permissions.role': { $in: ['owner', 'editor'] } },
        ],
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found or no permission' });
        return;
      }

      // Update fields
      if (title !== undefined) note.title = title;
      if (tags !== undefined) note.metadata.tags = tags;
      if (isPublic !== undefined) note.isPublic = isPublic;
      if (backgroundUrl !== undefined) note.metadata.backgroundUrl = backgroundUrl;
      note.metadata.lastEditedBy = new mongoose.Types.ObjectId(userId);

      await note.save();

      res.json({ note });
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ error: 'Failed to update note' });
    }
  }

  /**
   * DELETE /api/notes/:id
   * Delete a note
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid note ID' });
        return;
      }

      const note = await Note.findOneAndDelete({
        _id: id,
        ownerId: userId, // Only owner can delete
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found or no permission to delete' });
        return;
      }

      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Delete note error:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  }

  /**
   * GET /api/notes/:id/snapshot
   * Get Yjs document snapshot
   */
  public async getSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid note ID' });
        return;
      }

      const note = await Note.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId },
          { isPublic: true },
        ],
      }).select('yDocSnapshot');

      if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }

      res.json({ 
        snapshot: note.yDocSnapshot ? note.yDocSnapshot.toString('base64') : null 
      });
    } catch (error) {
      console.error('Get snapshot error:', error);
      res.status(500).json({ error: 'Failed to get snapshot' });
    }
  }

  /**
   * POST /api/notes/:id/share
   * Share a note
   */
  public async share(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { isPublic, userEmail, role } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid note ID' });
        return;
      }

      const note = await Note.findOne({
        _id: id,
        ownerId: userId, // Only owner can share
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found or no permission to share' });
        return;
      }

      // Update public status
      if (isPublic !== undefined) {
        note.isPublic = isPublic;
      }

      await note.save();

      // Generate share URL
      const shareUrl = note.isPublic 
        ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/note/${id}`
        : null;

      res.json({ 
        message: 'Sharing updated',
        isPublic: note.isPublic,
        shareUrl,
      });
    } catch (error) {
      console.error('Share note error:', error);
      res.status(500).json({ error: 'Failed to share note' });
    }
  }

  /**
   * POST /api/notes/:id/pdf-backgrounds
   * Upload a PDF and generate background images for each page
   */
  public async uploadPdfBackgrounds(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid note ID' });
        return;
      }

      // 权限校验：只有拥有者或具有编辑权限的用户可以上传背景
      const note = await Note.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId, 'permissions.role': { $in: ['owner', 'editor'] } },
        ],
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found or no permission' });
        return;
      }

      // 调用服务函数，将上传的 PDF 存储并（占位）生成页面 URL
      const pageUrls = await convertPdfToImages(file.path, id);

      res.json({
        pages: pageUrls.map((url, index) => ({
          pageIndex: index,
          url,
        })),
      });
    } catch (error) {
      console.error('Upload PDF backgrounds error:', error);
      res.status(500).json({ error: 'Failed to process PDF' });
    }
  }
}
