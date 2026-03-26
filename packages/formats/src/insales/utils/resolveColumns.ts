import { baseColumns } from ".";
import { Columns } from "../../../types";

export function resolveColumns(
  options?: Columns
): string[] {

  // properties
  let propertiesColumns: string[] = [];
  if (options?.properties?.length) {
    propertiesColumns = options.properties.map(
      (p) => `Параметр: ${p}`
    );
  }

  // params
  let paramsColumns: string[] = [];
  if (options?.params?.length) {
    paramsColumns = options.params.map(
      (p) => `Свойство: ${p}`
    );
  }

  return [
    ...baseColumns,
    ...propertiesColumns,
    ...paramsColumns,
  ];
}