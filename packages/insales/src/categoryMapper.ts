import { Category, Product } from "@goods-converter/core";

export function createCategoryMapper(categories?: Category[]) {
  const mappedCategories: Record<number, Category> = {};

  categories?.forEach((c) => (mappedCategories[c.id] = c));

  return function getCategories(product: Product) {
    const result: Record<string, string> = {};
    const categoryList: string[] = [];

    function addCategory(categoryId?: number) {
      if (!categoryId) return;

      const category = mappedCategories[categoryId];
      if (!category) return;

      categoryList.push(category.name);
      addCategory(category.parentId);
    }

    addCategory(product.categoryId);

    categoryList.forEach((name, i) => {
      const index = categoryList.length - 1 - i;
      const key = index === 0 ? "Корневая" : `Подкатегория ${index}`;
      result[key] = name;
    });

    return result;
  };
}