import { Transform } from "stream";
import type { Product, Category, Brand } from "@flowmerce/core";

import { createCategoryMapper } from "./categoryMapper";
import { createRowMapper } from "./rowMapper";
import { Columns } from "@flowmerce/core/src/types/Columns.types";
import { resolveColumns } from "./resolveColumns";

interface Options {
    categories?: Category[];
    brands?: Brand[];
    columns?: Columns;
}

function escape(value: unknown) {
    if (value === undefined || value === null) return "";

    const str = String(value);

    if (str.includes('"') || str.includes(";") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}

export function insalesFormatter(options: Options = {}) {
    const mappedBrands: Record<number, Brand> = {};
    options.brands?.forEach((b) => {
        mappedBrands[b.id] = b;
    });

    const getCategories = createCategoryMapper(options.categories);
    const mapRow = createRowMapper(mappedBrands, getCategories);

    let resolvedColumns: string[] | null = null;
    let headerWritten = false;

    return new Transform({
        objectMode: true,

        transform(batch: Product[], _, cb) {
            if (!resolvedColumns) {
                resolvedColumns = resolveColumns(batch, options.columns);
            }

            if (!headerWritten) {
                this.push(resolvedColumns.join(";") + "\n");
                headerWritten = true;
            }
            
            for (const product of batch) {
                const row = mapRow(product);

                const line = resolvedColumns
                    .map((col) => escape((row as any)[col]))
                    .join(";");

                this.push(line + "\n");
            }

            cb();
        },
    });
}