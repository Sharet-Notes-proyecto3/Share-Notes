import {
  getSemesterRange,
  isValidSemesterForProgram,
  getSemesterRangeErrorMessage,
} from '../utils/academicValidation';

describe('Academic Validation Unit Tests', () => {
  describe('getSemesterRange', () => {
    test('retorna { min: 1, max: 6 } para tecnologo', () => {
      expect(getSemesterRange('tecnologo')).toEqual({ min: 1, max: 6 });
    });

    test('retorna { min: 7, max: 10 } para ingenieria', () => {
      expect(getSemesterRange('ingenieria')).toEqual({ min: 7, max: 10 });
    });

    test('lanza error para tipo de programa no soportado', () => {
      expect(() => getSemesterRange('maestria' as any)).toThrow(
        "Tipo de programa inválido: maestria"
      );
    });
  });

  describe('isValidSemesterForProgram', () => {
    test('Tecnólogo acepta semestres del 1 al 6', () => {
      for (let s = 1; s <= 6; s++) {
        expect(isValidSemesterForProgram('tecnologo', s)).toBe(true);
        expect(isValidSemesterForProgram('tecnologo', String(s))).toBe(true);
      }
    });

    test('Tecnólogo rechaza semestres fuera del rango 1-6', () => {
      expect(isValidSemesterForProgram('tecnologo', 0)).toBe(false);
      expect(isValidSemesterForProgram('tecnologo', 7)).toBe(false);
      expect(isValidSemesterForProgram('tecnologo', 8)).toBe(false);
      expect(isValidSemesterForProgram('tecnologo', 10)).toBe(false);
      expect(isValidSemesterForProgram('tecnologo', -1)).toBe(false);
      expect(isValidSemesterForProgram('tecnologo', 'abc')).toBe(false);
    });

    test('Ingeniería acepta semestres del 7 al 10', () => {
      for (let s = 7; s <= 10; s++) {
        expect(isValidSemesterForProgram('ingenieria', s)).toBe(true);
        expect(isValidSemesterForProgram('ingenieria', String(s))).toBe(true);
      }
    });

    test('Ingeniería rechaza semestres fuera del rango 7-10', () => {
      expect(isValidSemesterForProgram('ingenieria', 1)).toBe(false);
      expect(isValidSemesterForProgram('ingenieria', 6)).toBe(false);
      expect(isValidSemesterForProgram('ingenieria', 0)).toBe(false);
      expect(isValidSemesterForProgram('ingenieria', 11)).toBe(false);
    });

    test('Rechaza si programType no es tecnologo ni ingenieria', () => {
      expect(isValidSemesterForProgram('otro', 3)).toBe(false);
      expect(isValidSemesterForProgram(null, 3)).toBe(false);
      expect(isValidSemesterForProgram(undefined, 3)).toBe(false);
    });
  });

  describe('getSemesterRangeErrorMessage', () => {
    test('retorna mensaje correcto para tecnologo', () => {
      expect(getSemesterRangeErrorMessage('tecnologo')).toContain('1 y 6');
    });

    test('retorna mensaje correcto para ingenieria', () => {
      expect(getSemesterRangeErrorMessage('ingenieria')).toContain('7 y 10');
    });
  });
});
