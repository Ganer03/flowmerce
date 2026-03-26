import { Product } from "../../../types";

export function getParams(product: Product): Record<string, string> {
  const properties: Record<string, string> = {};

  product.params?.forEach((p) => {
    properties[`Свойство: ${p.key}`] = p.value;
  });

  return properties;
}

export function getProperties(product: Product): Record<string, string> {
  const properties: Record<string, string> = {};

  product.properties?.forEach((p) => {
    properties[`Параметр: ${p.key}`] = p.value;
  });

  return properties;
}