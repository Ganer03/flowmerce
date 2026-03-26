export function escape(value: unknown) {
    if (value === undefined || value === null) return "";

    const str = String(value);

    if (str.includes('"') || str.includes(";") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}