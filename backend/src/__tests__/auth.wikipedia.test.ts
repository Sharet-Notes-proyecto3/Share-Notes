/// <reference types="jest" />

// Tests para Integrante 1: Endpoint y Servicio de Wikipedia (Tema Relacionado)
import { describe, test, expect, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { getRelatedTopic } from '../controllers/auth.controller';

// Mock de la base de datos para no abrir conexión en tests unitarios
jest.mock('../config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

// Mock de la función externa de wikipedia
jest.mock('../integrations/wikipedia.api', () => ({
  getRelatedArticle: jest.fn(async (topic: string) => {
    if (topic.toLowerCase().includes('desarrollo')) {
      return 'https://es.wikipedia.org/wiki/Desarrollo_de_software';
    }
    if (topic.toLowerCase().includes('inexistente')) {
      return null;
    }
    return `https://es.wikipedia.org/wiki/${encodeURIComponent(topic)}`;
  }),
}));

const createMockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as unknown as Response, status, json };
};

describe('Integrante 1 — Auth & Wikipedia Topic Tests', () => {
  const service = new AuthService();

  test('INT1-01 | Debería retornar artículo de Wikipedia cuando se pasa un tema válido', async () => {
    const result = await service.getRelatedTopic('desarrollo de software');
    expect(result).toHaveProperty('articulo');
    expect(result.articulo).toBe('https://es.wikipedia.org/wiki/Desarrollo_de_software');
  });

  test('INT1-02 | Debería retornar articulo null cuando el tema está vacío o solo espacios', async () => {
    const resultVacio = await service.getRelatedTopic('');
    expect(resultVacio).toEqual({ articulo: null });

    const resultEspacios = await service.getRelatedTopic('   ');
    expect(resultEspacios).toEqual({ articulo: null });
  });

  test('INT1-03 | Debería retornar articulo null si la API de Wikipedia no encuentra resultados', async () => {
    const result = await service.getRelatedTopic('inexistente');
    expect(result).toEqual({ articulo: null });
  });

  test('INT1-04 | Controlador getRelatedTopic debería responder con JSON del resultado', async () => {
    const req = { query: { tema: 'desarrollo de software' } } as unknown as Request;
    const { res, json } = createMockRes();
    const next = jest.fn() as unknown as NextFunction;

    await getRelatedTopic(req, res, next);

    expect(json).toHaveBeenCalledWith({
      articulo: 'https://es.wikipedia.org/wiki/Desarrollo_de_software',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('INT1-05 | Controlador getRelatedTopic debería manejar query tema ausente devolviendo null', async () => {
    const req = { query: {} } as unknown as Request;
    const { res, json } = createMockRes();
    const next = jest.fn() as unknown as NextFunction;

    await getRelatedTopic(req, res, next);

    expect(json).toHaveBeenCalledWith({ articulo: null });
    expect(next).not.toHaveBeenCalled();
  });
});
