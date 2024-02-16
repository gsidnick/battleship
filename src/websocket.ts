import WebSocket from 'ws';
import { RoomPlayer } from './types';

export default class PlayerWebSocket extends WebSocket {
  private roomPlayer: RoomPlayer = {} as RoomPlayer;

  set player(data: RoomPlayer) {
    this.roomPlayer = data;
  }

  get player(): RoomPlayer {
    return this.roomPlayer;
  }
}
