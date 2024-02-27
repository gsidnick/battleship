import db from '../db';
import { Response, ResponseData } from '../types';
import { stringifyResponse } from '../utils';
import PlayerWebSocket from '../websocket';

export const addClient = (client: PlayerWebSocket): void => {
  db.clients.push(client);
};

export const removeClient = (playerId: number): void => {
  let clientIndex = -1;

  db.clients.forEach((client, i) => {
    if (client.player.index === playerId) {
      clientIndex = i;
    }
  });

  if (clientIndex !== -1) {
    db.clients.splice(clientIndex, 1);
  }
};

export const sendToAllClients = (response: Response<ResponseData>): void => {
  const message: string = stringifyResponse(response);
  db.clients.forEach((client) => {
    client.send(message);
  });
};

export const sendToSpecifyClients = (response: Response<ResponseData>, playersId: number[]): void => {
  const message: string = stringifyResponse(response);
  playersId.forEach((id) => {
    const client = db.clients.find((item) => item.player.index === id);
    client?.send(message);
  });
};
