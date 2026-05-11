import {Router} from 'express';
import {
    createNote,
    deleteNote,
    getNoteById, getNotes,
    updateNote
} from "../controllers/notesController.js";


const router = Router();

router.get('/notes', getNotes);
router.get('/notes/:NoteId', getNoteById);
router.post('/notes', createNote);
router.delete('/notes/:NoteId', deleteNote)
router.patch('/notes/:NoteId', updateNote)

export default router;
