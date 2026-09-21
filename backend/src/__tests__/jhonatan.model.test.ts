// ==========================================================
// Integrante: Jhonatan Muchavisoy
// Capa: MODELO
// Objetivo:
// Validar reglas de negocio, estructura de datos
// y seguridad básica del sistema.
// ==========================================================

import bcrypt from "bcryptjs";

// ==========================================================
// VALIDADORES
// ==========================================================

const VALID_ROLES = ["student", "admin"] as const;

const VALID_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return typeof password === "string" && password.length >= 8;
};

const isValidRole = (role: string): boolean => {
  return VALID_ROLES.includes(role as any);
};

const isValidFileType = (mimetype: string): boolean => {
  return VALID_FILE_TYPES.includes(mimetype as any);
};

const isValidFileSize = (sizeBytes: number, maxMB = 10): boolean => {
  return sizeBytes > 0 && sizeBytes <= maxMB * 1024 * 1024;
};

// ==========================================================
// TESTS
// ==========================================================

describe("JHONATAN — Modelo: Validaciones y Seguridad", () => {
  // ========================================================
  // EMAILS
  // ========================================================

  describe("Validación de Emails", () => {
    test.each([
      ["sinArroba", false],
      ["sin@dominio", false],
      ["@sinUsuario.com", false],
      ["", false],
      ["paula@uniputumayo.edu.co", true],
      ["docente@uni.edu.co", true],
    ])("Debe validar email: %s", (email, expected) => {
      expect(isValidEmail(email)).toBe(expected);
    });
  });

  // ========================================================
  // CONTRASEÑAS
  // ========================================================

  describe("Validación de Contraseñas", () => {
    test.each([
      ["abc", false],
      ["1234567", false],
      ["", false],
      ["12345678", true],
      ["MiPass123!", true],
    ])("Debe validar contraseña: %s", (password, expected) => {
      expect(isValidPassword(password)).toBe(expected);
    });
  });

  // ========================================================
  // ROLES
  // ========================================================

  describe("Validación de Roles", () => {
    test.each([
      ["student", true],
      ["admin", true],
      ["teacher", false],
      ["moderator", false],
      ["superadmin", false],
      ["user", false],
      ["", false],
      ["ADMIN", false],
    ])("Debe validar rol: %s", (role, expected) => {
      expect(isValidRole(role)).toBe(expected);
    });
  });

  // ========================================================
  // TIPOS DE ARCHIVOS
  // ========================================================

  describe("Validación de Tipos de Archivo", () => {
    test.each([
      ["application/pdf", true],
      ["image/jpeg", true],
      ["image/png", true],
      ["application/exe", false],
      ["text/plain", false],
      ["video/mp4", false],
      ["application/zip", false],
    ])("Debe validar tipo de archivo: %s", (fileType, expected) => {
      expect(isValidFileType(fileType)).toBe(expected);
    });
  });

  // ========================================================
  // TAMAÑO DE ARCHIVOS
  // ========================================================

  describe("Validación de Tamaño de Archivo", () => {
    test("Debe aceptar archivos menores a 10MB", () => {
      const result = isValidFileSize(5 * 1024 * 1024);

      expect(result).toBe(true);
    });

    test("Debe rechazar archivos mayores a 10MB", () => {
      const result = isValidFileSize(15 * 1024 * 1024);

      expect(result).toBe(false);
    });
  });

  // ========================================================
  // HASH DE CONTRASEÑAS
  // ========================================================

  describe("Hash y Seguridad de Contraseñas", () => {
    test("Debe hashear y validar contraseñas correctamente", async () => {
      // Arrange
      const password = "MiPassword123";

      // Act
      const hash = await bcrypt.hash(password, 12);

      const validPassword = await bcrypt.compare(password, hash);

      const invalidPassword = await bcrypt.compare("otraPassword", hash);

      // Assert
      expect(hash).not.toBe(password);
      expect(validPassword).toBe(true);
      expect(invalidPassword).toBe(false);
    });
  });
});
