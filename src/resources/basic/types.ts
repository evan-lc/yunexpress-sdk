export type CountryItem = {
  country_code?: string;
  country_name?: string;
  country_name_en?: string;
} & Record<string, unknown>;

export type GetCountryCodesResponse = CountryItem[];

export type ProductItem = {
  product_code?: string;
  product_name?: string;
  product_group_code?: string;
} & Record<string, unknown>;

export type GetProductsResponse = ProductItem[];
