export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printError(message: string): void {
  console.error(`Error: ${message}`);
}

export async function readDataInput(data: string): Promise<unknown> {
  if (data === "-") {
    return readStdin();
  }

  if (data.startsWith("@")) {
    const { readFile } = await import("node:fs/promises");
    const filePath = data.slice(1);
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  }

  return JSON.parse(data);
}

async function readStdin(): Promise<unknown> {
  const chunks: Buffer[] = [];
  const stdin = process.stdin;

  return new Promise((resolve, reject) => {
    stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    stdin.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch {
        reject(new Error("Invalid JSON from stdin"));
      }
    });
    stdin.on("error", reject);
  });
}
