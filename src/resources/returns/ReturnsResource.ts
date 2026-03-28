import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCreateReturnOrderRequest,
  type CreateReturnOrderRequest,
  type CreateReturnOrderResponse,
} from "./types.ts";

export class ReturnsResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "returns");
  }

  createReturnOrder(
    input: CreateReturnOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<CreateReturnOrderResponse>> {
    assertValidCreateReturnOrderRequest(input);

    return this.request<CreateReturnOrderResponse>({
      ...options,
      method: "POST",
      path: "/v1/openapi/order/add",
      body: {
        product_code: input.productCode,
        handle_code: input.handleCode,
        warehouse_code: input.warehouseCode,
        send_type: input.sendType,
        tracking_number: input.trackingNumber,
        send_service_name: input.sendServiceName,
        weight: input.weight,
        length: input.length,
        width: input.width,
        height: input.height,
        extra_services: input.extraServices,
        sender: {
          name: input.sender.name,
          phone_number: input.sender.phoneNumber,
          country_code: input.sender.countryCode,
          province: input.sender.province,
          city: input.sender.city,
          address_lines: input.sender.addressLines,
          address_lines1: input.sender.addressLines1,
          address_lines2: input.sender.addressLines2,
          postal_code: input.sender.postalCode,
        },
        goods_list: input.goodsList.map((item) => ({
          name_local: item.nameLocal,
          name_en: item.nameEn,
          quantity: item.quantity,
          ...item,
        })),
        label_type: input.labelType,
        receiver: input.receiver
          ? {
              name: input.receiver.name,
              company: input.receiver.company,
              phone_number: input.receiver.phoneNumber,
              country_code: input.receiver.countryCode,
              province: input.receiver.province,
              city: input.receiver.city,
              address_lines: input.receiver.addressLines,
              address_lines1: input.receiver.addressLines1,
              address_lines2: input.receiver.addressLines2,
              postal_code: input.receiver.postalCode,
              email: input.receiver.email,
            }
          : undefined,
        ioss_number: input.iossNumber,
        vat_number: input.vatNumber,
        eori_number: input.eoriNumber,
        customer_order_no: input.customerOrderNo,
        send_service_code: input.sendServiceCode,
      },
    });
  }
}
