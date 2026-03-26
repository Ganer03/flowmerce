import { HandlebarsStreamWriter } from "@flowmerce/core";
import { Brand, Category, Columns, Product } from "../types";
import { createCategoryMapper, buildRowTemplate, resolveColumns, escape, getParams, getProperties } from "./utils";

interface OptionsInsales {
    categories?: Category[];
    brands?: Brand[];
    columns?: Columns;
}

export function insalesStreamWriter(options: OptionsInsales = {}) {

    const mappedBrands: Record<number, Brand> = {};
    options.brands?.forEach((b) => {
        mappedBrands[b.id] = b;
    });
    const getCategories = createCategoryMapper(options.categories);
    const resolvedColumns = resolveColumns(options.columns);
    
    const hsw = new HandlebarsStreamWriter();

    hsw.registerHelper("escape", escape);
    hsw.registerHelper("join", (arr: string[], sep: string) => arr?.join(sep) ?? "");
    hsw.registerHelper("json", (value: unknown) => (value ? JSON.stringify(value) : ""));
    hsw.registerHelper("not", (v: unknown) => !v);
    hsw.registerHelper("if", function (cond: boolean, value: unknown) {
    return cond ? value : "";
    });
    hsw.registerHelper("brandLogo", function (product: Product) {
        if (product.vendorId === undefined) return "";
        return mappedBrands[product.vendorId]?.logoUrl ?? "";
    });
    hsw.registerHelper("category", function (product: Product, key: string) {
        const categories = getCategories(product);
        return categories[key] ?? "";
    });

    hsw.registerHelper("param", function (product: Product, key: string) {
        const params = getParams(product);
        return params[`Свойство: ${key}`] ?? "";
    });

    hsw.registerHelper("property", function (product: Product, key: string) {
        const props = getProperties(product);
        return props[`Параметр: ${key}`] ?? "";
    });

    hsw.setHeader(resolvedColumns.join(";") + "\n");
    const template = buildRowTemplate(resolvedColumns);
    hsw.setBody(template);
    hsw.setFooter(``);

    return hsw;
}