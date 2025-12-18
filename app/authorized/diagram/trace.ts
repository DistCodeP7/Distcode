export type VClock = Record<string, number>;

export type TJob_Process_Messages = {
  id: number;
  jobUid: string;
  eventId: string;
  messageId: string;
  timestamp: number; // Milliseconds
  from: string;
  to: string;
  eventType: "SEND" | "RECV" | "DROP" | string;
  messageType: string;
  vector_clock: VClock;
  payload: unknown;
};

export type PairedTransmission = {
  messageId: string;
  from: string;
  to: string;
  type: string;
  sendEvent: TJob_Process_Messages;
  recvEvent?: TJob_Process_Messages;
  latency?: number;
  payload: unknown;
};

export function getLogicalTime(clock: VClock | undefined): number {
  if (!clock) return 0;
  return Object.values(clock).reduce((acc, val) => acc + val, 0);
}

export function pairEvents(
  events: TJob_Process_Messages[]
): PairedTransmission[] {
  const map = new Map<string, Partial<PairedTransmission>>();

  events.forEach((e) => {
    if (!map.has(e.messageId)) {
      map.set(e.messageId, {
        messageId: e.messageId,
        from: e.from,
        to: e.to,
        type: e.messageType,
        payload: e.payload,
      });
    }

    const entry = map.get(e.messageId);
    if (!entry) return;

    const evtType = e.eventType.toUpperCase();
    if (evtType === "SEND") entry.sendEvent = e;
    else if (evtType === "RECV") entry.recvEvent = e;
  });

  function hasSendAndRecv(
    x: Partial<PairedTransmission>
  ): x is PairedTransmission & {
    sendEvent: TJob_Process_Messages;
    recvEvent: TJob_Process_Messages;
  } {
    return !!x.sendEvent && !!x.recvEvent;
  }

  return Array.from(map.values())
    .filter(hasSendAndRecv)
    .map((x) => ({
      ...x,
      latency: parseFloat(
        (x.recvEvent.timestamp - x.sendEvent.timestamp).toFixed(3)
      ),
    }));
}

export function getActorColor(actor: string) {
  let hash = 0;
  for (let i = 0; i < actor.length; i++)
    hash = actor.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${"00000".substring(0, 6 - c.length)}${c}`;
}
