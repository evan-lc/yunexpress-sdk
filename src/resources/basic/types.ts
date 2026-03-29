export type CountryItem = {
  country_code?: string;
  country_name?: string;
  country_name_en?: string;
  country_code_three?: string;
  country_number?: number;
  international_code?: string;
} & Record<string, unknown>;

export type GetCountryCodesResponse = CountryItem[];

export interface GetProductsRequest {
  countryCode?: string;
}

export type ProductItem = {
  product_code?: string;
  product_name?: string;
  product_group_code?: string;
} & Record<string, unknown>;

export type GetProductsResponse = ProductItem[];
