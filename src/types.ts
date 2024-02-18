// eslint-disable-next-line import/no-cycle
import PlayerWebSocket from './websocket';

export interface PlayerCredentials {
  name: string;
  password: string;
}

export interface PlayerResponse {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface RoomPlayer {
  name: string;
  index: number;
}

export interface Player {
  playerId: number;
  name: string;
  password: string;
}

export interface Room {
  roomId: number;
  roomUsers: RoomPlayer[];
}

export interface RoomIndex {
  indexRoom: number;
}

export interface Winner {
  name: string;
  wins: number;
}

export interface Game {
  idGame: number;
  idPlayer: number;
}

export interface Response<T> {
  type: string;
  data: T;
  id: number;
}

export type PlayerCredentialsType = {
  type: 'reg';
  data: PlayerCredentials;
};

export type CreateRoomType = {
  type: 'create_room';
  data: '';
};

export type AddUserToRoomType = {
  type: 'add_user_to_room';
  data: RoomIndex;
};

export type Players = Player[];
export type Rooms = Room[];
export type RoomPlayers = RoomPlayer[];
export type Winners = Winner[];
export type Clients = PlayerWebSocket[];
export type ResponseData = PlayerResponse | Rooms | Winners | Game;
export type RequestData = PlayerCredentialsType | CreateRoomType | AddUserToRoomType;

export type Request = RequestData & {
  id: number;
};
