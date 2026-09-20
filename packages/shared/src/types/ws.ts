export type WsMessageType =
  | "terminal:input"
  | "terminal:output"
  | "terminal:resize"
  | "terminal:connected"
  | "terminal:error"
  | "terminal:close"
  | "terminal:attach";

export interface WsMessage {
  type: WsMessageType;
  connectionId: string;
  data?: string;
  cols?: number;
  rows?: number;
  error?: string;
  /** terminal:attach only — target this exact session instead of "any session for this connection". */
  sessionId?: string;
}
