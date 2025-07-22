import prisma from "../prisma/client";

export class NoteService {
  static async findNotesByUserId(userId: number) {
    return await prisma.note.findMany({
      where: { userId },
      include: { checkboxes: true }
    });
  }

  static async findNoteById(id: number) {
    return await prisma.note.findUnique({
      where: { id },
      include: { checkboxes: true }
    });
  }

  static async createNote(noteData: {
    title: string;
    content: string;
    color?: string;
    isPinned?: boolean;
    userId: number;
    checkboxes?: Array<{ label: string; checked: boolean }>;
  }) {
    const { checkboxes, ...data } = noteData;
    
    return await prisma.note.create({
      data: {
        ...data,
        checkboxes: {
          create: checkboxes?.map((cb) => ({
            label: cb.label,
            checked: cb.checked
          })) || []
        }
      },
      include: { checkboxes: true }
    });
  }

  static async updateNote(id: number, noteData: {
    title?: string;
    content?: string;
    color?: string;
    isPinned?: boolean;
    isShared?: boolean;
  }) {
    return await prisma.note.update({
      where: { id },
      data: noteData
    });
  }

  static async deleteNote(id: number) {
    await prisma.checkbox.deleteMany({ where: { noteId: id } });
    return await prisma.note.delete({ where: { id } });
  }

  static async updateCheckbox(checkboxId: number, checked: boolean) {
    return await prisma.checkbox.update({
      where: { id: checkboxId },
      data: { checked }
    });
  }

  static async findCheckboxById(checkboxId: number) {
    return await prisma.checkbox.findUnique({
      where: { id: checkboxId },
      include: { note: true }
    });
  }
}