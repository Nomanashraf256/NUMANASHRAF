import {copyFile, mkdir} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const output = new URL('./public/', import.meta.url);
await mkdir(new URL('assets/', output), {recursive:true});
for (const name of ['index.html','notifications.js','app.js','style.css','chat.css','vad.js']) {
  const directory = ['index.html','notifications.js'].includes(name) ? '' : 'assets/';
  await copyFile(new URL(name, root), new URL(directory + name, output));
}
