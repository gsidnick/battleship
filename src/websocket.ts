import WebSocket from 'ws';
// eslint-disable-next-line import/no-cycle
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
