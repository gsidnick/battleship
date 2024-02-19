import db from '../db';
import { Response, Winners } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const updateWinners = (): Response<Winners> => {
  const { winners } = db;
  return {
    type: 'update_winners',
    data: winners,
    id: 0,
  };
};
