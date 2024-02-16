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

export interface Player {
  playerId: number;
  name: string;
  password: string;
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
export type ResponseData = PlayerResponse;
export type RequestData = PlayerCredentials;
