import crypto from 'node:crypto';
import { RawData } from 'ws';
import { Response, Request, ResponseData, RequestData, Player } from './types';

export const parseRequest = (buffer: RawData): Request<RequestData> => {
  const response = JSON.parse(buffer.toString());
  const { type, data } = response;

  return {
    type,
    data: data ? JSON.parse(data) : data,
    id: 0,
  };
};

export const stringifyResponse = (response: Response<ResponseData>): string => {
  const { type, data } = response;
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id: 0,
  });
};

export const generateId = (arr: Array<Player>): number => {
  let index = 0;

  arr.forEach((item) => {
    if ('playerId' in item) {
      index = item.playerId;
    }
  });

  return index + 1;
};

export const hashPassword = (password: string): string => {
  const sha256 = crypto.createHash('sha256');
  sha256.update(password);
  return sha256.digest('hex');
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const sha256 = crypto.createHash('sha256');
  sha256.update(password);
  const hashedPassword = sha256.digest('hex');
  return hashedPassword === hash;
};
