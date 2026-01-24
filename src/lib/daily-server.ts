export type DailyRoom = {
  name: string;
  url: string;
};

export async function createDailyRoom(params: {
  name: string;
  startAt: Date;
  endAt: Date;
  domain: string;
  apiKey: string;
}): Promise<DailyRoom> {
  const { name, startAt, endAt, domain, apiKey } = params;

  // liberação: 10 min antes, expira 2h após o fim (só pra evitar bug)
  const nbf = Math.floor((startAt.getTime() - 10 * 60 * 1000) / 1000);
  const exp = Math.floor((endAt.getTime() + 2 * 60 * 60 * 1000) / 1000);

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        nbf,
        exp,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Daily API error: ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return { name: data.name, url: data.url };
}
