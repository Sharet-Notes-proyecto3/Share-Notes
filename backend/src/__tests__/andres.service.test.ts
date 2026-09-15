// Integrante: Yhan Moreno — Backend
// Capa: SERVICIO — Reglas de negocio, manejo de excepciones y flujos lógicos

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test_secret_key_sharenotes_2026";

async function simulateLogin(
  email: string,
  password: string,
  dbUser: any | null,
) {
  if (!dbUser) throw new Error("Credenciales incorrectas");
  if (!dbUser.is_active) throw new Error("Cuenta suspendida");
  const valid = await bcrypt.compare(password, dbUser.password_hash);
  if (!valid) throw new Error("Credenciales incorrectas");
  const token = jwt.sign(
    { userId: dbUser.id, email: dbUser.email, role: dbUser.role },
    JWT_SECRET,
    { expiresIn: "1d" },
  );
  return {
    token,
    user: { id: dbUser.id, email: dbUser.email, role: dbUser.role },
  };
}

async function simulateRegister(
  name: string,
  email: string,
  password: string,
  existingUser: any | null,
) {
  if (existingUser) throw new Error("El correo ya está registrado");
  if (password.length < 8) throw new Error("Contraseña muy corta");
  const hash = await bcrypt.hash(password, 10);
  return { id: 99, name, email, passwordHash: hash, role: "student" };
}

function validateFileSize(sizeBytes: number): boolean {
  const MAX = 10 * 1024 * 1024;
  return sizeBytes > 0 && sizeBytes <= MAX;
}

describe("YHAN — Capa Servicio: Reglas de negocio y manejo de excepciones", () => {
  beforeEach(() => jest.clearAllMocks());

  test("YHA-01 | testDeberiaLanzarExcepcionSiElEmailYaEstaRegistrado", async () => {
    const existente = { id: 1, email: "paula@uni.edu.co" };
    await expect(
      simulateRegister("Paula", "paula@uni.edu.co", "Pass1234", existente),
    ).rejects.toThrow("El correo ya está registrado");
  });

  test("YHA-02 | testDeberiaLanzarExcepcionSiLasCredencialesSonIncorrectas", async () => {
    const hash = await bcrypt.hash("PasswordCorrecto", 10);
    const dbUser = {
      id: 1,
      email: "yhan@uni.edu.co",
      password_hash: hash,
      role: "student",
      is_active: true,
    };
    await expect(
      simulateLogin("yhan@uni.edu.co", "PasswordIncorrecto", dbUser),
    ).rejects.toThrow("Credenciales incorrectas");
  });

  test("YHA-03 | testDeberiaLanzarExcepcionSiCuentaEstaSuspendida", async () => {
    const hash = await bcrypt.hash("Pass1234", 10);
    const suspendido = {
      id: 2,
      email: "suspendido@uni.edu.co",
      password_hash: hash,
      role: "student",
      is_active: false,
    };
    await expect(
      simulateLogin("suspendido@uni.edu.co", "Pass1234", suspendido),
    ).rejects.toThrow("Cuenta suspendida");
  });

  test("YHA-04 | testDeberiaGenerarTokenJWTValido", async () => {
    const hash = await bcrypt.hash("Pass1234", 10);
    const dbUser = {
      id: 5,
      email: "admin@uni.edu.co",
      password_hash: hash,
      role: "admin",
      is_active: true,
    };
    const resultado = await simulateLogin(
      "admin@uni.edu.co",
      "Pass1234",
      dbUser,
    );
    expect(resultado).toHaveProperty("token");
    expect(resultado.user.role).toBe("admin");
    const decoded: any = jwt.verify(resultado.token, JWT_SECRET);
    expect(decoded.userId).toBe(5);
    expect(decoded.role).toBe("admin");
  });

  test("YHA-05 | testDeberiaRechazarArchivoQueExcedaElLimiteDeTamano", () => {
    expect(validateFileSize(5 * 1024 * 1024)).toBe(true);
    expect(validateFileSize(10 * 1024 * 1024)).toBe(true);
    expect(validateFileSize(11 * 1024 * 1024)).toBe(false);
    expect(validateFileSize(0)).toBe(false);
  });
});
