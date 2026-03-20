import type { Product } from "@flowmerce/core";
import type { Columns } from "@flowmerce/core/src/types/Columns.types";

import { baseColumns } from "./columns";
import { getParams, getProperties } from "./paramsMapper";

export function resolveColumns(
  batch: Product[],
  options?: Columns
): string[] {
  const firstProduct = batch[0];

  // properties
  let propertiesColumns: string[] = [];
  if (options?.properties?.length) {
    propertiesColumns = options.properties.map(
      (p) => `Параметр: ${p}`
    );
  } else if (firstProduct) {
    propertiesColumns = Object.keys(getProperties(firstProduct));
  }

  // params
  let paramsColumns: string[] = [];
  if (options?.params?.length) {
    paramsColumns = options.params.map(
      (p) => `Свойство: ${p}`
    );
  } else if (firstProduct) {
    paramsColumns = Object.keys(getParams(firstProduct));
  }

  return [
    ...baseColumns,
    ...propertiesColumns,
    ...paramsColumns,
  ];
}