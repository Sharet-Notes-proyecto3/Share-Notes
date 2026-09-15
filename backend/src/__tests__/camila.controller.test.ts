// Integrante: Paula Ayala — Frontend / Controladores
// Capa: CONTROLADOR — Códigos HTTP, formato JSON y mapeo de rutas

function mockRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as any, status, json };
}

async function registerCtrl(req: any, res: any) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Campos requeridos" });
  if (password.length < 8)
    return res.status(400).json({ message: "Contraseña muy corta" });
  if (email === "duplicado@uni.edu.co")
    return res.status(409).json({ message: "El correo ya está registrado" });
  return res.status(201).json({
    message: "Registro exitoso",
    user: { id: 1, name, email, role: "student" },
  });
}

async function loginCtrl(req: any, res: any) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email y contraseña requeridos" });
  if (password === "incorrecta")
    return res.status(401).json({ message: "Credenciales incorrectas" });
  return res
    .status(200)
    .json({ token: "eyJ.fake.token", user: { email, role: "student" } });
}

async function listNotesCtrl(_req: any, res: any) {
  return res.status(200).json([
    { id: 1, title: "Apuntes Cálculo", subject_name: "Cálculo I", semester: 1 },
    { id: 2, title: "Apuntes Redes", subject_name: "Redes", semester: 5 },
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
describe("PAULA — Capa Controlador: Códigos HTTP y respuestas JSON", () => {
  beforeEach(() => jest.clearAllMocks());

  test("PAU-01 | testDeberiaRetornar400SiFaltanCamposEnElRegistro", async () => {
    const req = { body: { name: "Paula" } };
    const { res, status, json } = mockRes();
    await registerCtrl(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Campos requeridos" }),
    );
  });

  test("PAU-02 | testDeberiaRetornar201AlRegistrarseCorrectamente", async () => {
    const req = {
      body: {
        name: "Paula Ayala",
        email: "paula@uni.edu.co",
        password: "Pass1234",
      },
    };
    const { res, status, json } = mockRes();
    await registerCtrl(req, res);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Registro exitoso" }),
    );
  });

  test("PAU-03 | testDeberiaRetornar400SiContrasenaEsMenorA8Caracteres", async () => {
    const req = {
      body: { name: "Paula", email: "paula@uni.edu.co", password: "123" },
    };
    const { res, status, json } = mockRes();
    await registerCtrl(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Contraseña muy corta" }),
    );
  });

  test("PAU-04 | testDeberiaRetornar400SiFaltanCamposEnElLogin", async () => {
    const req = { body: { email: "paula@uni.edu.co" } };
    const { res, status, json } = mockRes();
    await loginCtrl(req, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Email y contraseña requeridos" }),
    );
  });

  test("PAU-05 | testDeberiaRetornar200ConListaDeApuntesEnFormatoJSON", async () => {
    const req = { body: {}, user: { userId: 1, role: "student" } };
    const { res, status, json } = mockRes();
    await listNotesCtrl(req, res);
    expect(status).toHaveBeenCalledWith(200);
    const respuesta = json.mock.calls[0][0];
    expect(Array.isArray(respuesta)).toBe(true);
    expect(respuesta).toHaveLength(2);
    expect(respuesta[0]).toHaveProperty("title");
  });
});
