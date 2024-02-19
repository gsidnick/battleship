import db from '../db';
import { Response, ResponseData, RoomPlayers } from '../types';
import { stringifyResponse } from '../utils';
import PlayerWebSocket from '../websocket';

export const addClient = (client: PlayerWebSocket): void => {
  db.clients.push(client);
};

export const sendToAllClients = (response: Response<ResponseData>): void => {
  const message: string = stringifyResponse(response);
  db.clients.forEach((client) => {
    client.send(message);
  });
};

export const sendToSpecifyClients = (response: Response<ResponseData>, players: RoomPlayers): void => {
  const message: string = stringifyResponse(response);
  players.forEach((player) => {
    const client = db.clients.find((item) => item.player.index === player.index);
    client?.send(message);
  });
};
