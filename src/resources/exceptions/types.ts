import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface ReleaseIssueRequest {
  waybillNumber: string;
  remark?: string;
  newWaybillNumbers?: string[];
  extraCodes?: Array<"203" | "204" | "205" | "206">;
}

export interface MarkIssueReadRequest {
  waybillNumber: string;
}

export interface GetIssueOptionsRequest {
  waybillNumber: string;
}

export interface GetIssueOrderDetailRequest {
  waybillNumber: string;
}

export interface ModifyIssueDeclarationInfoRequest {
  waybillNumber: string;
  declarationInfo: IssueDeclarationInfoUpdateItem[];
}

export type IssueType = 1 | 2;

export type IssueHandleType = 1 | 2 | 3 | 4;

export type IssueWarehouseProcessCode = "202" | "207" | "208" | "209" | "210";

export type IssueReturnType = 1 | 2 | 3;

export type IssueRetryType = 1 | 2;

export type IssueChangeNumberType = 0 | 1;

export type IssueHandlingPlan =
  | "ABANDONED"
  | "BACK"
  | "ASSIGN_OLD_ADDRESS"
  | "ASSIGN_NEW_ADDRESS"
  | "UPDATE_INFO";

export interface HandleIssueRequest {
  waybillNumber: string;
  handleType: IssueHandleType;
  issueType: IssueType;
  remark?: string;
}

export interface SubmitIssueAppealRequest {
  waybillNumbers: string[];
  fileIds: string[];
  issueType: IssueType;
  remark?: string;
}

export interface RequestIssueWarehouseProcessRequest {
  waybillNumber: string;
  extraCode: IssueWarehouseProcessCode;
  remark?: string;
}

export interface ChangeIssueWaybillNumberRequest {
  waybillNumber: string;
  newWaybillNumber?: string;
  changeNumberType: IssueChangeNumberType;
  issueType: IssueType;
}

export interface SupplyIssueReturnRequest {
  waybillNumber: string;
  returnType: IssueReturnType;
  driverBringBack?: IssueAddressInfo;
  cashOnDelivery?: IssueAddressInfo;
  selfPickup?: IssueAddressInfo;
}

export interface ReforecastIssueRequest {
  waybillNumber: string;
  company?: string;
  firstName: string;
  lastName?: string;
  addressLines: string[];
  province: string;
  city: string;
  email?: string;
  phoneNumber: string;
  postalCode: string;
  houseNumber?: string;
  certificateCode?: string;
  vatCode?: string;
  declarationInfo: IssueReforecastDeclarationItem[];
}

export interface RetryIssueDeliveryRequest {
  waybillNumber: string;
  retryType: IssueRetryType;
  receiver?: IssueReceiverInfo;
}

export interface SelectIssueSolutionRequest {
  waybillNumber: string;
  planCode?: string;
  planDesc?: string;
  planName?: string;
  fileIds?: string[];
}

export interface SubmitIssueCustomerFeedbackRequest {
  waybillNumber: string;
  handlingPlan: IssueHandlingPlan;
  fileIds?: string[];
  consignee?: IssueReceiverInfo;
}

export type IssueDeclarationInfoUpdateItem = {
  declarationId: string;
  nameLocal?: string;
  nameEn?: string;
  material?: string;
  purpose?: string;
} & Record<string, unknown>;

export type IssueAddressInfo = {
  countryCode?: string;
  province?: string;
  city?: string;
  region?: string;
  address?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  company?: string;
  postalCode?: string;
  email?: string;
  addressLines?: string[];
  houseNumber?: string;
  vatCode?: string;
  remark?: string;
} & Record<string, unknown>;

export type IssueReceiverInfo = IssueAddressInfo;

export type IssueReforecastDeclarationItem = {
  declarationId: string;
  nameLocal?: string;
  nameEn?: string;
  quantity?: string | number;
  unitPrice?: string | number;
  unitWeight?: string | number;
  remark?: string;
  hsCode?: string;
  skuCode?: string;
  salesUrl?: string;
  originCountry?: string;
} & Record<string, unknown>;

export type IssueReceiveAddressItem = {
  warehouse_code?: string;
  warehouse_name?: string;
  address?: string;
  first_name?: string;
  phone_number?: string;
} & Record<string, unknown>;

export type GetIssueReceiveAddressesResponse = IssueReceiveAddressItem[];

export type IssueOptionItem = {
  plan_code?: string;
  plan_name?: string;
} & Record<string, unknown>;

export type GetIssueOptionsResponse = IssueOptionItem[];

export type IssueSolutionItem = {
  plan_code?: string;
  plan_name?: string;
  plan_desc?: string;
} & Record<string, unknown>;

export type SelectIssueSolutionResponse = IssueSolutionItem[];

export type GetIssueOrderDetailResponse = {
  waybill_number?: string;
  parent_waybill_number?: string | null;
  customer_order_number?: string;
  tracking_number?: string | null;
  product_code?: string;
  country_code?: string;
  wo_info?: Array<Record<string, unknown>>;
  operation_info?: Array<Record<string, unknown>>;
  return_info?: Record<string, unknown> | null;
  func_btn_list?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

export function assertValidReleaseIssueRequest(input: ReleaseIssueRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (input.remark !== undefined && input.remark.length > 255) {
    throw validationError("remark must be at most 255 characters.");
  }

  if (input.newWaybillNumbers !== undefined && input.newWaybillNumbers.length > 100) {
    throw validationError("newWaybillNumbers must contain at most 100 items.");
  }

  if (input.extraCodes) {
    const hasSplit = input.extraCodes.includes("205");
    const hasMerge = input.extraCodes.includes("204");

    if (hasSplit && hasMerge) {
      throw validationError("Split (205) and Merge (204) are mutually exclusive.");
    }
  }
}

export function assertValidMarkIssueReadRequest(input: MarkIssueReadRequest): void {
  assertWaybillNumber(input.waybillNumber);
}

export function assertValidGetIssueOptionsRequest(input: GetIssueOptionsRequest): void {
  assertWaybillNumber(input.waybillNumber);
}

export function assertValidGetIssueOrderDetailRequest(input: GetIssueOrderDetailRequest): void {
  assertWaybillNumber(input.waybillNumber);
}

export function assertValidHandleIssueRequest(input: HandleIssueRequest): void {
  assertWaybillNumber(input.waybillNumber);
  assertIssueType(input.issueType);

  if (![1, 2, 3, 4].includes(input.handleType)) {
    throw validationError("handleType must be one of 1, 2, 3, or 4.");
  }

  if (input.remark !== undefined && input.remark.length > 255) {
    throw validationError("remark must be at most 255 characters.");
  }
}

export function assertValidSubmitIssueAppealRequest(input: SubmitIssueAppealRequest): void {
  assertIssueType(input.issueType);
  assertWaybillNumberArray(input.waybillNumbers, "waybillNumbers");
  assertStringArray(input.fileIds, "fileIds", { min: 1, max: 5, maxItemLength: 32 });

  if (input.remark !== undefined && input.remark.length > 255) {
    throw validationError("remark must be at most 255 characters.");
  }
}

export function assertValidRequestIssueWarehouseProcessRequest(
  input: RequestIssueWarehouseProcessRequest,
): void {
  assertWaybillNumber(input.waybillNumber);

  if (!["202", "207", "208", "209", "210"].includes(input.extraCode)) {
    throw validationError("extraCode must be one of 202, 207, 208, 209, or 210.");
  }

  if (input.remark !== undefined && input.remark.length > 255) {
    throw validationError("remark must be at most 255 characters.");
  }
}

export function assertValidChangeIssueWaybillNumberRequest(
  input: ChangeIssueWaybillNumberRequest,
): void {
  assertWaybillNumber(input.waybillNumber);
  assertIssueType(input.issueType);

  if (![0, 1].includes(input.changeNumberType)) {
    throw validationError("changeNumberType must be 0 or 1.");
  }

  if (input.changeNumberType === 0) {
    assertWaybillNumberField(input.newWaybillNumber, "newWaybillNumber");
  }

  if (input.issueType === 2 && input.changeNumberType !== 0) {
    throw validationError("changeNumberType must be 0 when issueType is 2.");
  }
}

export function assertValidSupplyIssueReturnRequest(input: SupplyIssueReturnRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (![1, 2, 3].includes(input.returnType)) {
    throw validationError("returnType must be one of 1, 2, or 3.");
  }

  if (input.returnType === 1 && !input.driverBringBack) {
    throw validationError("driverBringBack is required when returnType is 1.");
  }

  if (input.returnType === 2 && !input.cashOnDelivery) {
    throw validationError("cashOnDelivery is required when returnType is 2.");
  }

  if (input.returnType === 3 && !input.selfPickup) {
    throw validationError("selfPickup is required when returnType is 3.");
  }
}

export function assertValidReforecastIssueRequest(input: ReforecastIssueRequest): void {
  assertWaybillNumber(input.waybillNumber);
  assertRequiredString(input.firstName, "firstName");
  assertRequiredString(input.province, "province");
  assertRequiredString(input.city, "city");
  assertRequiredString(input.phoneNumber, "phoneNumber");
  assertRequiredString(input.postalCode, "postalCode");

  if (!Array.isArray(input.addressLines) || input.addressLines.length === 0) {
    throw validationError("addressLines must contain at least one line.");
  }

  if (input.addressLines.length > 3) {
    throw validationError("addressLines must contain at most 3 lines.");
  }

  if (!Array.isArray(input.declarationInfo) || input.declarationInfo.length === 0) {
    throw validationError("declarationInfo must contain at least one declaration item.");
  }

  input.declarationInfo.forEach((item, index) => {
    if (typeof item.declarationId !== "string" || !item.declarationId.trim()) {
      throw validationError(`declarationInfo[${index}].declarationId is required.`);
    }
  });
}

export function assertValidRetryIssueDeliveryRequest(input: RetryIssueDeliveryRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (![1, 2].includes(input.retryType)) {
    throw validationError("retryType must be 1 or 2.");
  }

  if (input.retryType === 2 && !input.receiver) {
    throw validationError("receiver is required when retryType is 2.");
  }
}

export function assertValidSelectIssueSolutionRequest(input: SelectIssueSolutionRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (input.fileIds !== undefined) {
    assertStringArray(input.fileIds, "fileIds", { min: 0 });
  }
}

export function assertValidSubmitIssueCustomerFeedbackRequest(
  input: SubmitIssueCustomerFeedbackRequest,
): void {
  assertWaybillNumber(input.waybillNumber);

  if (
    !["ABANDONED", "BACK", "ASSIGN_OLD_ADDRESS", "ASSIGN_NEW_ADDRESS", "UPDATE_INFO"].includes(
      input.handlingPlan,
    )
  ) {
    throw validationError(
      "handlingPlan must be one of ABANDONED, BACK, ASSIGN_OLD_ADDRESS, ASSIGN_NEW_ADDRESS, or UPDATE_INFO.",
    );
  }

  if (input.fileIds !== undefined) {
    assertStringArray(input.fileIds, "fileIds", { min: 0 });
  }
}

export function assertValidModifyIssueDeclarationInfoRequest(
  input: ModifyIssueDeclarationInfoRequest,
): void {
  assertWaybillNumber(input.waybillNumber);

  if (!Array.isArray(input.declarationInfo) || input.declarationInfo.length === 0) {
    throw validationError("declarationInfo must contain at least one declaration item.");
  }

  input.declarationInfo.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw validationError(`declarationInfo[${index}] must be an object.`);
    }

    if (typeof item.declarationId !== "string" || !item.declarationId.trim()) {
      throw validationError(`declarationInfo[${index}].declarationId is required.`);
    }
  });
}

function assertIssueType(issueType: IssueType): void {
  if (![1, 2].includes(issueType)) {
    throw validationError("issueType must be 1 or 2.");
  }
}

function assertWaybillNumberArray(values: string[], fieldName: string): void {
  assertStringArray(values, fieldName, { min: 1, maxItemLength: 50 });
}

function assertStringArray(
  values: string[],
  fieldName: string,
  options: { min: number; max?: number; maxItemLength?: number } = { min: 1 },
): void {
  if (!Array.isArray(values)) {
    throw validationError(`${fieldName} must be an array.`);
  }

  if (values.length < options.min) {
    throw validationError(
      `${fieldName} must contain at least ${options.min} item${options.min === 1 ? "" : "s"}.`,
    );
  }

  if (options.max !== undefined && values.length > options.max) {
    throw validationError(`${fieldName} must contain at most ${options.max} items.`);
  }

  values.forEach((value, index) => {
    if (typeof value !== "string" || !value.trim()) {
      throw validationError(`${fieldName}[${index}] is required.`);
    }

    if (options.maxItemLength !== undefined && value.trim().length > options.maxItemLength) {
      throw validationError(
        `${fieldName}[${index}] must be at most ${options.maxItemLength} characters.`,
      );
    }
  });
}

function assertRequiredString(value: string, fieldName: string): void {
  if (typeof value !== "string" || !value.trim()) {
    throw validationError(`${fieldName} is required.`);
  }
}

function assertWaybillNumberField(value: string | undefined, fieldName: string): void {
  if (typeof value !== "string") {
    throw validationError(`${fieldName} is required.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw validationError(`${fieldName} is required.`);
  }

  if (trimmed.length > 50) {
    throw validationError(`${fieldName} must be between 1 and 50 characters.`);
  }
}

function assertWaybillNumber(waybillNumber: string): void {
  const trimmed = waybillNumber.trim();

  if (!trimmed) {
    throw validationError("waybillNumber is required.");
  }

  if (trimmed.length > 50) {
    throw validationError("waybillNumber must be between 1 and 50 characters.");
  }
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
