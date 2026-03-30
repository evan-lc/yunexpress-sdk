import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCancelB2BOrderRequest,
  assertValidCreateB2BOrderRequest,
  assertValidGetB2BLabelRequest,
  assertValidGetB2BLastMileCarriersRequest,
  assertValidGetB2BProductsRequest,
  assertValidGetB2BSelfWarehousesRequest,
  assertValidGetB2BWarehouseAddressesRequest,
  assertValidGetB2BWaybillDetailRequest,
  assertValidHoldB2BOrderRequest,
  type CancelB2BOrderRequest,
  type B2BCollectWarehouseItem,
  type CreateB2BOrderDeclarationItem,
  type CreateB2BOrderDeliveryInfo,
  type CreateB2BOrderPackage,
  type CreateB2BOrderReceiver,
  type CreateB2BOrderRequest,
  type CreateB2BOrderResponse,
  type B2BLabelResponse,
  type B2BLastMileCarrierItem,
  type B2BProductItem,
  type B2BSelfWarehouseItem,
  type B2BSecondaryAddressTypeItem,
  type B2BWarehouseAddressItem,
  type GetB2BCollectWarehousesResponse,
  type GetB2BLabelRequest,
  type GetB2BLastMileCarriersRequest,
  type GetB2BLastMileCarriersResponse,
  type GetB2BProductsRequest,
  type GetB2BProductsResponse,
  type GetB2BSelfWarehousesRequest,
  type GetB2BSelfWarehousesResponse,
  type GetB2BSecondaryAddressTypesResponse,
  type GetB2BWarehouseAddressesRequest,
  type GetB2BWarehouseAddressesResponse,
  type GetB2BWaybillDetailRequest,
  type GetB2BWaybillDetailResponse,
  type HoldB2BOrderRequest,
} from "./types.ts";

export class B2BResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "b2b");
  }

  getWaybillDetail(
    input: GetB2BWaybillDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BWaybillDetailResponse>> {
    assertValidGetB2BWaybillDetailRequest(input);

    return this.request<GetB2BWaybillDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/b2b/info/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  getLabel(
    input: GetB2BLabelRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<B2BLabelResponse>> {
    assertValidGetB2BLabelRequest(input);

    return this.request<B2BLabelResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/b2b/label/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  getLastMileCarriers(
    input: GetB2BLastMileCarriersRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BLastMileCarriersResponse>> {
    assertValidGetB2BLastMileCarriersRequest(input);

    return this.request<{ carriers?: B2BLastMileCarrierItem[] }>({
      ...options,
      method: "POST",
      path: "/v1/order/b2b/last-mile/get",
      body: {
        waybill_numbers: input.waybillNumbers,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) => {
        if (
          data &&
          typeof data === "object" &&
          Array.isArray((data as { carriers?: unknown }).carriers)
        ) {
          return (data as { carriers: B2BLastMileCarrierItem[] }).carriers;
        }

        return [];
      }),
    );
  }

  getProducts(
    input: GetB2BProductsRequest = {},
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BProductsResponse>> {
    assertValidGetB2BProductsRequest(input);

    return this.request<GetB2BProductsResponse>({
      ...options,
      method: "GET",
      path: "/v1/basic-data/b2b/products/getlist",
      query: {
        ...options.query,
        country_code: input.countryCode,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (_data, rawBody) => {
        if (
          rawBody &&
          typeof rawBody === "object" &&
          Array.isArray((rawBody as { detail?: unknown }).detail)
        ) {
          return (rawBody as { detail: B2BProductItem[] }).detail;
        }

        return [];
      }),
    );
  }

  getSecondaryAddressTypes(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BSecondaryAddressTypesResponse>> {
    return this.request<GetB2BSecondaryAddressTypesResponse>({
      ...options,
      method: "GET",
      path: "/v1/warehouse/b2b/category/get",
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as B2BSecondaryAddressTypeItem[]) : [],
      ),
    );
  }

  getWarehouseAddresses(
    input: GetB2BWarehouseAddressesRequest = {},
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BWarehouseAddressesResponse>> {
    assertValidGetB2BWarehouseAddressesRequest(input);

    return this.request<GetB2BWarehouseAddressesResponse>({
      ...options,
      method: "GET",
      path: "/v1/warehouse/b2b/address/get",
      query: {
        ...options.query,
        address_type: input.addressType,
        secondary_address_type: input.secondaryAddressType,
        country_code: input.countryCode,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as B2BWarehouseAddressItem[]) : [],
      ),
    );
  }

  getSelfWarehouses(
    input: GetB2BSelfWarehousesRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BSelfWarehousesResponse>> {
    assertValidGetB2BSelfWarehousesRequest(input);

    return this.request<GetB2BSelfWarehousesResponse>({
      ...options,
      method: "GET",
      path: "/v1/basic-data/b2b/products/getselfwarehouses",
      query: {
        ...options.query,
        product_code: input.productCode,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (_data, rawBody) => {
        if (
          rawBody &&
          typeof rawBody === "object" &&
          Array.isArray((rawBody as { detail?: unknown }).detail)
        ) {
          return (rawBody as { detail: B2BSelfWarehouseItem[] }).detail;
        }

        return [];
      }),
    );
  }

  getCollectWarehouses(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetB2BCollectWarehousesResponse>> {
    return this.request<GetB2BCollectWarehousesResponse>({
      ...options,
      method: "GET",
      path: "/api/warehouse-info/get",
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as B2BCollectWarehouseItem[]) : [],
      ),
    );
  }

  cancelOrder(
    input: CancelB2BOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidCancelB2BOrderRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/order/b2b/cancel",
      body: {
        waybill_number: input.waybillNumber,
      },
    });
  }

  holdOrder(
    input: HoldB2BOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidHoldB2BOrderRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/order/b2b/hold",
      body: {
        waybill_number: input.waybillNumber,
        remark: input.remark,
      },
    });
  }

  createOrder(
    input: CreateB2BOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<CreateB2BOrderResponse>> {
    assertValidCreateB2BOrderRequest(input);

    return this.request<CreateB2BOrderResponse>({
      ...options,
      method: "POST",
      path: "/v1/order/b2b/create",
      body: {
        customer_order_number: input.customerOrderNumber,
        product_code: input.productCode,
        country_code: input.countryCode,
        ein_number: input.einNumber,
        import_company: input.importCompany,
        bond_expire_time: input.bondExpireTime,
        reference_id: input.referenceId,
        goods_type: input.goodsType,
        currency: input.currency,
        coupon_code: input.couponCode,
        extra_services: input.extraServices,
        receiver: normalizeCreateB2BOrderReceiver(input.receiver),
        packages: input.packages.map(normalizeCreateB2BOrderPackage),
        delivery_info: normalizeCreateB2BOrderDeliveryInfo(input.deliveryInfo),
        source_code: input.sourceCode,
      },
    });
  }
}

function normalizeCreateB2BOrderReceiver(input: CreateB2BOrderReceiver): Record<string, unknown> {
  const { countryCode, addressLines, postalCode, phoneNumber, houseNumber, ...rest } = input;

  return {
    ...rest,
    country_code: countryCode,
    address_lines: addressLines,
    postal_code: postalCode,
    phone_number: phoneNumber,
    house_number: houseNumber,
  };
}

function normalizeCreateB2BOrderPackage(input: CreateB2BOrderPackage): Record<string, unknown> {
  const { boxNumber, referenceId, declarationInfo, ...rest } = input;

  return {
    ...rest,
    box_number: boxNumber,
    reference_id: referenceId,
    declaration_info: declarationInfo?.map(normalizeCreateB2BOrderDeclarationItem),
  };
}

function normalizeCreateB2BOrderDeclarationItem(
  input: CreateB2BOrderDeclarationItem,
): Record<string, unknown> {
  const { unitPrice, unitWeight, nameCn, nameEn, hsCode, goodsUrl, quantityUnit, ...rest } = input;

  return {
    ...rest,
    unit_price: unitPrice,
    unit_weight: unitWeight,
    name_cn: nameCn,
    name_en: nameEn,
    hs_code: hsCode,
    goods_url: goodsUrl,
    quantity_unit: quantityUnit,
  };
}

function normalizeCreateB2BOrderDeliveryInfo(
  input: CreateB2BOrderDeliveryInfo,
): Record<string, unknown> {
  const { deliveryType, collectAddress, collectStartTime, collectEndTime, ...rest } = input;

  return {
    ...rest,
    delivery_type: deliveryType,
    collect_address: collectAddress,
    collect_starttime: collectStartTime,
    collect_endtime: collectEndTime,
  };
}

function normalizeArrayResponse<TArray extends unknown[]>(
  response: TransportResponse<unknown>,
  extract: (data: unknown, rawBody: unknown) => TArray,
): TransportResponse<TArray> {
  const normalized = extract(response.data, response.rawBody);

  return {
    ...response,
    data: normalized,
    envelope: {
      ...response.envelope,
      result: normalized,
    },
  } as TransportResponse<TArray>;
}
