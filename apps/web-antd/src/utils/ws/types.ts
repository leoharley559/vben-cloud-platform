export type CloudWsStatus = 'closed' | 'connecting' | 'open' | 'reconnecting';

export interface CloudWsOptions {
  /** 自动重连，默认 true */
  autoReconnect?: boolean;
  /** 二进制消息是否按 arraybuffer 接收 */
  binaryType?: BinaryType;
  /** 收到消息时是否尝试 AES 解密（客服/聊天室），默认 false */
  decrypt?: boolean;
  /** 最大重连次数，默认 Infinity */
  maxRetries?: number;
  /** 连接关闭回调 */
  onClose?: (event: CloseEvent) => void;
  /** 错误回调 */
  onError?: (event: Event) => void;
  /** 文本/已解密消息 */
  onMessage?: (data: ArrayBuffer | string) => void;
  /** 连接成功回调 */
  onOpen?: (event: Event) => void;
  /** 状态变化 */
  onStatusChange?: (status: CloudWsStatus) => void;
  /** 重连基础间隔 ms，默认 2000，指数退避上限 30s */
  reconnectInterval?: number;
}
