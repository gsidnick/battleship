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

export interface GamePlayer {
  idGame: number;
  idPlayer: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export type AttackStatus = 'miss' | 'killed' | 'shot';
export type MapLabel = 'X' | 'O' | 'N';
export type Map = MapLabel[][];

export interface Ship {
  position: Coordinate;
  direction: boolean;
  length: number;
  type: ShipType;
}

export type Ships = Ship[];

export interface PlayerShips {
  gameId: number;
  ships: Ships;
  indexPlayer: number;
}

export type GamePlayerShips = Omit<PlayerShips, 'gameId'> & {
  map: Map;
};

export interface Game {
  gameId: number;
  gameShips: GamePlayerShips[];
}

export interface GameStart {
  ships: Ships;
  currentPlayerIndex: number;
}

export interface Turn {
  currentPlayer: number;
}

export interface AttackResult {
  position: Coordinate;
  currentPlayer: number;
  status: AttackStatus;
}

export interface AttackData {
  x: number;
  y: number;
  gameId: number;
  indexPlayer: number;
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

export type AddShipsType = {
  type: 'add_ships';
  data: PlayerShips;
};

export type Attack = {
  type: 'attack';
  data: AttackData;
};

export type Players = Player[];
export type Rooms = Room[];
export type RoomPlayers = RoomPlayer[];
export type Winners = Winner[];
export type Games = Game[];
export type Clients = PlayerWebSocket[];
export type ResponseData = PlayerResponse | Rooms | Winners | GamePlayer | GameStart | Turn;
export type RequestData = PlayerCredentialsType | CreateRoomType | AddUserToRoomType | AddShipsType | Attack;

export type Request = RequestData & {
  id: number;
};
