import { wsDecrypt } from '#/utils/crypto';

import type { CloudWsOptions, CloudWsStatus } from './types';

/**
 * 云后台通用 WebSocket 客户端
 * - 客服：VITE_WBSOCKT_URL / VITE_MJ_WBSOCKT_URL
 * - 币商：VITE_BS_WBSOCKT_URL / VITE_BS_MJ_WBSOCKT_URL
 * - 聊天室网关：VITE_GATEWAY_CONFIG
 *
 * 仅负责连接生命周期；Protobuf 编解码由各业务域自行接入。
 */
export class CloudWebSocket {
  private readonly url: string;
  private readonly options: Required<
    Pick<
      CloudWsOptions,
      'autoReconnect' | 'decrypt' | 'maxRetries' | 'reconnectInterval'
    >
  > &
    CloudWsOptions;

  private socket: null | WebSocket = null;
  private status: CloudWsStatus = 'closed';
  private retries = 0;
  private manualClose = false;
  private reconnectTimer: null | ReturnType<typeof setTimeout> = null;

  constructor(url: string, options: CloudWsOptions = {}) {
    this.url = url;
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      binaryType: options.binaryType ?? 'arraybuffer',
      decrypt: options.decrypt ?? false,
      maxRetries: options.maxRetries ?? Number.POSITIVE_INFINITY,
      onClose: options.onClose,
      onError: options.onError,
      onMessage: options.onMessage,
      onOpen: options.onOpen,
      onStatusChange: options.onStatusChange,
      reconnectInterval: options.reconnectInterval ?? 2000,
    };
  }

  get readyState() {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }

  get currentStatus() {
    return this.status;
  }

  connect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualClose = false;
    this.setStatus(this.retries > 0 ? 'reconnecting' : 'connecting');

    try {
      this.socket = new WebSocket(this.url);
      this.socket.binaryType = this.options.binaryType || 'arraybuffer';
    } catch (error) {
      console.error('[CloudWebSocket] create failed', error);
      this.scheduleReconnect();
      return;
    }

    this.socket.addEventListener('open', (event) => {
      this.retries = 0;
      this.setStatus('open');
      this.options.onOpen?.(event);
    });

    this.socket.addEventListener('message', (event) => {
      const raw = event.data as ArrayBuffer | Blob | string;
      if (raw instanceof Blob) {
        void raw.arrayBuffer().then((buffer) => {
          this.options.onMessage?.(buffer);
        });
        return;
      }
      if (typeof raw === 'string' && this.options.decrypt) {
        try {
          this.options.onMessage?.(wsDecrypt(raw));
          return;
        } catch (error) {
          console.error('[CloudWebSocket] decrypt failed', error);
        }
      }
      this.options.onMessage?.(raw);
    });

    this.socket.addEventListener('error', (event) => {
      this.options.onError?.(event);
    });

    this.socket.addEventListener('close', (event) => {
      this.setStatus('closed');
      this.options.onClose?.(event);
      if (!this.manualClose && this.options.autoReconnect) {
        this.scheduleReconnect();
      }
    });
  }

  send(data: ArrayBufferLike | Blob | string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[CloudWebSocket] send ignored, socket not open');
      return false;
    }
    this.socket.send(data as Blob | ArrayBuffer | string);
    return true;
  }

  close(code?: number, reason?: string) {
    this.manualClose = true;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
    this.setStatus('closed');
  }

  private setStatus(status: CloudWsStatus) {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.manualClose || !this.options.autoReconnect) {
      return;
    }
    if (this.retries >= this.options.maxRetries) {
      console.error('[CloudWebSocket] max retries reached');
      return;
    }
    this.clearReconnectTimer();
    const delay = Math.min(
      this.options.reconnectInterval * 2 ** this.retries,
      30_000,
    );
    this.retries += 1;
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export function getServiceWsUrl() {
  return String(import.meta.env.VITE_WBSOCKT_URL || '');
}

export function getServiceManagerWsUrl() {
  return String(import.meta.env.VITE_MJ_WBSOCKT_URL || '');
}

export function getCoinDealerWsUrl() {
  return String(import.meta.env.VITE_BS_WBSOCKT_URL || '');
}

export function getCoinDealerManagerWsUrl() {
  return String(import.meta.env.VITE_BS_MJ_WBSOCKT_URL || '');
}

export function getChatroomGatewayUrl() {
  return String(import.meta.env.VITE_GATEWAY_CONFIG || '');
}
