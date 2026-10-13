import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const slugs = ["casino-audio", "sci-fi-sounds", "interface-sounds"];
for (const slug of slugs) {
  const response = await fetch(`https://kenney.nl/assets/${slug}`);
  if (!response.ok) throw new Error(`${slug}: HTTP ${response.status}`);
  const html = await response.text();
  console.log(slug);
  console.log(html.split("\n").filter((line) => /data-download|download\.php|\.zip/.test(line)).join("\n"));
  if (process.argv[2]) {
    const url = html.match(/href='(https:\/\/kenney\.nl\/media\/[^']+\.zip)'/)?.[1];
    if (!url) throw new Error(`No official download found: ${slug}`);
    const archive = await fetch(url);
    if (!archive.ok) throw new Error(`Download HTTP ${archive.status}`);
    await mkdir(process.argv[2], { recursive: true });
    await writeFile(join(process.argv[2], `${slug}.zip`), Buffer.from(await archive.arrayBuffer()));
  }
}
