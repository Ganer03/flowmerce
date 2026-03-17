import { Transform } from "stream";
import fs from "fs";
import os from "os";
import path from "path";

import type { Product, Category, Brand } from "@goods-converter/core";

import { baseColumns } from "./columns";
import { createCategoryMapper } from "./categoryMapper";
import { createRowMapper } from "./rowMapper";

interface Options {
  categories?: Category[];
  brands?: Brand[];
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

  const baseColumnSet = new Set(baseColumns);
  const dynamicColumns = new Set<string>();

  const tempFile = path.join(
    os.tmpdir(),
    `insales-${Date.now()}-${Math.random()}.csv`
  );

  const tempStream = fs.createWriteStream(tempFile);

  return new Transform({
    objectMode: true,

    transform(batch: Product[], _, cb) {
      for (const product of batch) {
        const row = mapRow(product);

        Object.keys(row).forEach((key) => {
          if (!baseColumnSet.has(key)) {
            dynamicColumns.add(key);
          }
        });

        const line = baseColumns
          .map((column) => escape((row as any)[column]))
          .join(";");

        tempStream.write(line + "\n");
      }

      cb();
    },

    flush(cb) {
      tempStream.end(() => {
        const columns = [...baseColumns, ...Array.from(dynamicColumns)];

        this.push(columns.join(";") + "\n");

        const readStream = fs.createReadStream(tempFile);

        readStream.on("data", (chunk) => this.push(chunk));

        readStream.on("end", () => {
          fs.unlink(tempFile, () => {});
          cb();
        });
      });
    },
  });
}