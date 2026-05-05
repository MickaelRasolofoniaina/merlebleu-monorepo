import z from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Veuillez remplir le nom de l'utilisateur"),
  email: z
    .string()
    .min(1, "Veuillez remplir l'e-mail de l'utilisateur")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'e-mail invalide"),
  password: z
    .string()
    .min(1, "Veuillez remplir le mot de passe de l'utilisateur")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      "Le mot de passe doit contenir au moins un caractère spécial",
    ),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Veuillez remplir le nom de l'utilisateur"),
  email: z
    .string()
    .min(1, "Veuillez remplir l'e-mail de l'utilisateur")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'e-mail invalide"),
  password: z
    .string()
    .min(1, "Veuillez remplir le mot de passe de l'utilisateur")
    .min(8, "Le mot de passe doit contenir au moins 6 caractères")
    .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      "Le mot de passe doit contenir au moins un caractère spécial",
    ),
});

export const signInUserSchema = z.object({
  email: z
    .string()
    .min(1, "Veuillez remplir l'e-mail de l'utilisateur")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'e-mail invalide"),
  password: z
    .string()
    .min(1, "Veuillez remplir le mot de passe de l'utilisateur"),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UserDto = {
  id: string;
  name: string;
  email: string;
};
export type SignInUserDto = z.infer<typeof signInUserSchema>;
