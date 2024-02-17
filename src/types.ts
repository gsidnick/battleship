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
  roomPlayers: RoomPlayer[];
}

export interface Response<T> {
  type: string;
  data: T;
  id: number;
}

export interface Request<T> {
  type: string;
  data: T;
  id: number;
}

export type Players = Player[];
export type Rooms = Room[];
export type ResponseData = PlayerResponse | Rooms;
export type RequestData = PlayerCredentials;
