import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    await AuthService.createUser(email, password);
    res.json({ message: "Inscription réussie" });
  } catch {
    res.status(500).json({ error: "Email déjà utilisé" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  const user = await AuthService.findUserByEmail(email);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  const valid = await AuthService.validatePassword(password, user.password);
  if (!valid) return res.status(401).json({ error: "Mot de passe invalide" });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!);
  res.json({ token });
}
