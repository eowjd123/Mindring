import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function signUp(email: string, password: string, name?: string) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { email, passwordHash: hash, name } });
}

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
