import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV, buffCV, tupleCV, principalCV, boolCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_FACTORY = 101;
const ERR_INVALID_DETAILS = 102;
const ERR_INVALID_HASH = 103;
const ERR_ITEM_ALREADY_EXISTS = 104;
const ERR_ITEM_NOT_FOUND = 105;
const ERR_INVALID_MATERIAL = 108;
const ERR_INVALID_SIZE = 109;
const ERR_INVALID_COLOR = 110;
const ERR_INVALID_STYLE = 115;
const ERR_INVALID_BRAND = 116;
const ERR_INVALID_PRICE = 117;
const ERR_INVALID_ORIGIN = 118;
const ERR_INVALID_CERTIFICATION = 119;
const ERR_MAX_ITEMS_EXCEEDED = 112;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_AUTHORITY_NOT_VERIFIED = 107;
const ERR_INVALID_QR_CODE = 111;

interface ItemDetails {
  material: string;
  size: string;
  color: string;
  style: string;
  brand: string;
  price: number;
  origin: string;
  certification: string;
}

interface Item {
  factory: string;
  details: ItemDetails;
  hash: Uint8Array;
  qrCode: string;
  timestamp: number;
  creator: string;
  status: boolean;
}

interface ItemUpdate {
  updateDetails: ItemDetails;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class ItemCreationMock {
  state: {
    nextItemId: number;
    maxItems: number;
    creationFee: number;
    authorityContract: string | null;
    items: Map<number, Item>;
    itemUpdates: Map<number, ItemUpdate>;
    itemsByHash: Map<string, number>;
  } = {
    nextItemId: 0,
    maxItems: 1000000,
    creationFee: 500,
    authorityContract: null,
    items: new Map(),
    itemUpdates: new Map(),
    itemsByHash: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextItemId: 0,
      maxItems: 1000000,
      creationFee: 500,
      authorityContract: null,
      items: new Map(),
      itemUpdates: new Map(),
      itemsByHash: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setCreationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.creationFee = newFee;
    return { ok: true, value: true };
  }

  createItem(
    factory: string,
    details: ItemDetails,
    hash: Uint8Array,
    qrCode: string
  ): Result<number> {
    if (this.state.nextItemId >= this.state.maxItems) return { ok: false, value: ERR_MAX_ITEMS_EXCEEDED };
    if (factory === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_FACTORY };
    if (!details.material || details.material.length > 50) return { ok: false, value: ERR_INVALID_MATERIAL };
    if (!details.size || details.size.length > 20) return { ok: false, value: ERR_INVALID_SIZE };
    if (!details.color || details.color.length > 30) return { ok: false, value: ERR_INVALID_COLOR };
    if (!details.style || details.style.length > 50) return { ok: false, value: ERR_INVALID_STYLE };
    if (!details.brand || details.brand.length > 50) return { ok: false, value: ERR_INVALID_BRAND };
    if (details.price <= 0) return { ok: false, value: ERR_INVALID_PRICE };
    if (!details.origin || details.origin.length > 100) return { ok: false, value: ERR_INVALID_ORIGIN };
    if (details.certification.length > 100) return { ok: false, value: ERR_INVALID_CERTIFICATION };
    if (hash.length !== 32) return { ok: false, value: ERR_INVALID_HASH };
    if (!qrCode || qrCode.length > 200) return { ok: false, value: ERR_INVALID_QR_CODE };
    const hashKey = hash.toString();
    if (this.state.itemsByHash.has(hashKey)) return { ok: false, value: ERR_ITEM_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.creationFee, from: this.caller, to: this.state.authorityContract });

    const id = this.state.nextItemId;
    const item: Item = {
      factory,
      details,
      hash,
      qrCode,
      timestamp: this.blockHeight,
      creator: this.caller,
      status: true,
    };
    this.state.items.set(id, item);
    this.state.itemsByHash.set(hashKey, id);
    this.state.nextItemId++;
    return { ok: true, value: id };
  }

  getItem(id: number): Item | null {
    return this.state.items.get(id) || null;
  }

  updateItem(id: number, updateDetails: ItemDetails): Result<boolean> {
    const item = this.state.items.get(id);
    if (!item) return { ok: false, value: false };
    if (item.creator !== this.caller) return { ok: false, value: false };
    if (!updateDetails.material || updateDetails.material.length > 50) return { ok: false, value: false };
    if (!updateDetails.size || updateDetails.size.length > 20) return { ok: false, value: false };
    if (!updateDetails.color || updateDetails.color.length > 30) return { ok: false, value: false };
    if (!updateDetails.style || updateDetails.style.length > 50) return { ok: false, value: false };
    if (!updateDetails.brand || updateDetails.brand.length > 50) return { ok: false, value: false };
    if (updateDetails.price <= 0) return { ok: false, value: false };
    if (!updateDetails.origin || updateDetails.origin.length > 100) return { ok: false, value: false };
    if (updateDetails.certification.length > 100) return { ok: false, value: false };

    const updated: Item = {
      ...item,
      details: updateDetails,
      timestamp: this.blockHeight,
    };
    this.state.items.set(id, updated);
    this.state.itemUpdates.set(id, {
      updateDetails,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  verifyItemHash(id: number, hash: Uint8Array): Result<boolean> {
    const item = this.state.items.get(id);
    if (!item) return { ok: false, value: false };
    return { ok: true, value: item.hash.toString() === hash.toString() };
  }

  getItemCount(): Result<number> {
    return { ok: true, value: this.state.nextItemId };
  }

  checkItemExistence(hash: Uint8Array): Result<boolean> {
    return { ok: true, value: this.state.itemsByHash.has(hash.toString()) };
  }
}

describe("ItemCreation", () => {
  let contract: ItemCreationMock;

  beforeEach(() => {
    contract = new ItemCreationMock();
    contract.reset();
  });

  it("creates an item successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    const result = contract.createItem("STFACTORY", details, hash, "qr://example.com");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const item = contract.getItem(0);
    expect(item?.factory).toBe("STFACTORY");
    expect(item?.details.material).toBe("Cotton");
    expect(item?.qrCode).toBe("qr://example.com");
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate item hashes", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details, hash, "qr://example.com");
    const result = contract.createItem("STFACTORY2", details, hash, "qr://example2.com");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ITEM_ALREADY_EXISTS);
  });

  it("rejects item creation without authority contract", () => {
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    const result = contract.createItem("STFACTORY", details, hash, "qr://example.com");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid material", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    const result = contract.createItem("STFACTORY", details, hash, "qr://example.com");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MATERIAL);
  });

  it("updates an item successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details, hash, "qr://example.com");
    const updateDetails: ItemDetails = {
      material: "Silk",
      size: "L",
      color: "Red",
      style: "Formal",
      brand: "LuxuryY",
      price: 100,
      origin: "Italy",
      certification: "FairTrade",
    };
    const result = contract.updateItem(0, updateDetails);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const item = contract.getItem(0);
    expect(item?.details.material).toBe("Silk");
    expect(item?.details.price).toBe(100);
    const update = contract.state.itemUpdates.get(0);
    expect(update?.updateDetails.material).toBe("Silk");
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update for non-existent item", () => {
    contract.setAuthorityContract("ST2TEST");
    const updateDetails: ItemDetails = {
      material: "Silk",
      size: "L",
      color: "Red",
      style: "Formal",
      brand: "LuxuryY",
      price: 100,
      origin: "Italy",
      certification: "FairTrade",
    };
    const result = contract.updateItem(99, updateDetails);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects update by non-creator", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details, hash, "qr://example.com");
    contract.caller = "ST3FAKE";
    const updateDetails: ItemDetails = {
      material: "Silk",
      size: "L",
      color: "Red",
      style: "Formal",
      brand: "LuxuryY",
      price: 100,
      origin: "Italy",
      certification: "FairTrade",
    };
    const result = contract.updateItem(0, updateDetails);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("verifies item hash correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details, hash, "qr://example.com");
    const result = contract.verifyItemHash(0, hash);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const wrongHash = new Uint8Array(32).fill(2);
    const resultWrong = contract.verifyItemHash(0, wrongHash);
    expect(resultWrong.ok).toBe(true);
    expect(resultWrong.value).toBe(false);
  });

  it("sets creation fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setCreationFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.creationFee).toBe(1000);
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details, hash, "qr://example.com");
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("returns correct item count", () => {
    contract.setAuthorityContract("ST2TEST");
    const details1: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash1 = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details1, hash1, "qr://example.com");
    const details2: ItemDetails = {
      material: "Silk",
      size: "L",
      color: "Red",
      style: "Formal",
      brand: "LuxuryY",
      price: 100,
      origin: "Italy",
      certification: "FairTrade",
    };
    const hash2 = new Uint8Array(32).fill(2);
    contract.createItem("STFACTORY2", details2, hash2, "qr://example2.com");
    const result = contract.getItemCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("checks item existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const details: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details, hash, "qr://example.com");
    const result = contract.checkItemExistence(hash);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const wrongHash = new Uint8Array(32).fill(2);
    const result2 = contract.checkItemExistence(wrongHash);
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("rejects item creation with max items exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxItems = 1;
    const details1: ItemDetails = {
      material: "Cotton",
      size: "M",
      color: "Blue",
      style: "Casual",
      brand: "FashionX",
      price: 50,
      origin: "USA",
      certification: "Organic",
    };
    const hash1 = new Uint8Array(32).fill(1);
    contract.createItem("STFACTORY", details1, hash1, "qr://example.com");
    const details2: ItemDetails = {
      material: "Silk",
      size: "L",
      color: "Red",
      style: "Formal",
      brand: "LuxuryY",
      price: 100,
      origin: "Italy",
      certification: "FairTrade",
    };
    const hash2 = new Uint8Array(32).fill(2);
    const result = contract.createItem("STFACTORY2", details2, hash2, "qr://example2.com");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_ITEMS_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });
});