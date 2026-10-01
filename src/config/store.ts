/**
 * Seller details. These are also written to the `Setting` table by the seed
 * script ("store" key) so they can later be edited from the admin panel.
 */
export const storeConfig = {
  name: "Maheshwari Krishi Sewa Kendra",
  nameHi: "महेश्वरी कृषि सेवा केन्द्र",
  shortNameHi: "महेश्वरी",
  taglineHi: "कृषि सेवा केन्द्र",
  licenceNo: "890",
  gstin: "23ACRPM5603Q1Z2",
  /** GST state code — 23 = Madhya Pradesh. Used for CGST/SGST vs IGST. */
  stateCode: "23",
  address: {
    line1: "88, M.G. Road",
    city: "Sailana",
    district: "Ratlam",
    state: "Madhya Pradesh",
    pincode: "457550",
  },
  addressHi: "88, एम.जी. रोड, सैलाना, जिला रतलाम, मध्यप्रदेश – 457550",
  phone: "9993338008",
  whatsapp: "919993338008",
  email: "maheshwariksksailana@gmail.com",
  orderNumberPrefix: "MKSC",
} as const;

export type StoreConfig = typeof storeConfig;
