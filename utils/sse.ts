export const encodeSSE = (event: string, data: string) => {
  return new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`);
};
