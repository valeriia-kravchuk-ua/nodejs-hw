import {Note} from '../models/note.js';
import createHttpError from "http-errors";

// Отримати список усіх студентів
export const getNotes = async (req, res) => {
    const notes = await Note.find();
    res.status(200).json(notes);
};

// Отримати одного студента за id
export const getNoteById = async (req, res) => {
    const {NoteId} = req.params;
    const note = await Note.findById(NoteId);

    if (!Note) {
        throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
};


export const createNote = async (req, res) => {
    const note = await Note.create(req.body);
    res.status(201).json(note);
};

export const deleteNote = async (req, res) => {
    const {NoteId} = req.params;
    const note = await Note.findOneAndDelete({_id: NoteId});
    if (!note) {
        throw createHttpError(404, "Note not found");
    }
    res.status(200).json(note);
};

export const updateNote = async (req, res) => {
    const {NoteId} = req.params;
    const note = await Note.findOneAndUpdate({_id: NoteId}, req.body, {returnDocument: "after"});
    if (!note) {
        throw createHttpError(404, "Note not found");
    }
    res.status(200).json(note);
};