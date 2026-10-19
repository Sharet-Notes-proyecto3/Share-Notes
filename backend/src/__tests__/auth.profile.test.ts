/// <reference types="jest" />

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import pool from '../config/database';
import { AuthService } from '../services/auth.service';

jest.mock('../config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const queryMock = pool.query as jest.Mock;
const service = new AuthService();

describe('AuthService profile updates', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  test('updates and returns the authenticated user profile name', async () => {
    const profile = { id: 3, name: 'Moderador', email: 'moderator@sharenotes.edu' };
    queryMock
      .mockResolvedValueOnce([{}] as never)
      .mockResolvedValueOnce([[profile]] as never);

    await expect(service.updateProfileName(3, ' Moderador ')).resolves.toEqual(profile);
    expect(queryMock).toHaveBeenNthCalledWith(1, 'UPDATE users SET name = ? WHERE id = ?', ['Moderador', 3]);
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      'SELECT id, name, email, role, is_active, avatar_url, career_id, semester, program_type, created_at FROM users WHERE id = ?',
      [3]
    );
  });

  test('rejects an empty profile name before querying the database', async () => {
    await expect(service.updateProfileName(3, '   ')).rejects.toMatchObject({ statusCode: 400 });
    expect(queryMock).not.toHaveBeenCalled();
  });

  test('stores the profile photo URL and returns the refreshed profile', async () => {
    const profile = {
      id: 3,
      name: 'Moderador',
      email: 'moderator@sharenotes.edu',
      avatar_url: '/uploads/profile-photos/photo.png',
    };
    queryMock
      .mockResolvedValueOnce([[{ id: 3, avatar_url: null }]] as never)
      .mockResolvedValueOnce([{}] as never)
      .mockResolvedValueOnce([[profile]] as never);

    await expect(service.updateProfilePhoto(3, 'photo.png')).resolves.toEqual(profile);
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      ['/uploads/profile-photos/photo.png', 3]
    );
  });

  test('removes the profile photo URL', async () => {
    const profile = {
      id: 3,
      name: 'Moderador',
      email: 'moderator@sharenotes.edu',
      avatar_url: null,
    };
    queryMock
      .mockResolvedValueOnce([[{ id: 3, avatar_url: null }]] as never)
      .mockResolvedValueOnce([{}] as never)
      .mockResolvedValueOnce([[profile]] as never);

    await expect(service.removeProfilePhoto(3)).resolves.toEqual(profile);
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      'UPDATE users SET avatar_url = NULL WHERE id = ?',
      [3]
    );
  });
});
