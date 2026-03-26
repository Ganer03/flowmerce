export function normalizeTemplate(template: string, minify: boolean): string {
  if (!minify) return template;

  // 👇 захватываем переносы в начале и в конце
  const startMatch = template.match(/^\s*\n/);
  const endMatch = template.match(/\n\s*$/);

  const start = startMatch ? startMatch[0] : "";
  const end = endMatch ? endMatch[0] : "";

  // 👇 убираем края
  let core = template.trim();

  // 👇 убираем переносы внутри
  core = core
    .split("\n")
    .map(line => line.trim())
    .join("");

  return start + core + end;
}