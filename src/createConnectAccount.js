const moment = require("moment");
const _ = require("lodash");
const { delay } = require("./common");
const stripe = require("./stripe").secretKeyStripe;

const successfulAccount = {
  type: "custom",
  country: "AU",
  requested_capabilities: ["card_payments", "transfers"],
  tos_acceptance: {
    date: moment().unix(),
    ip: "1.1.1.1", //mike's IP address
    user_agent: "Chrome",
  },
  business_type: "company",
  business_profile: {
    product_description: "Mike Brewer UW Seller",
    mcc: 7922,
  },
  company: {
    name: "Subsonic",
    // https://stripe.com/docs/connect/testing#test-verification-addresses
    address: {
      line1: "address_full_match", // passes address check
      city: "Brisbane",
      country: "AU",
      state: "QLD",
      postal_code: "4000",
    },
    phone: "+61255515678",
    tax_id: "123123123",
  },
  external_account: {
    object: "bank_account",
    country: "AU",
    currency: "AUD",
    // More account numbers for simulating payouts failing: https://stripe.com/docs/connect/testing#payouts
    account_number: "000123456",
    routing_number: "110000",
  },
};

const ceo = {
  // https://stripe.com/docs/connect/testing#test-verification-addresses
  address: {
    line1: "address_full_match", // passes address check
    city: "Brisbane",
    country: "AU",
    state: "QLD",
    postal_code: "4000",
  },
  // 1901-01-01 passes verification checks. https://stripe.com/docs/connect/testing#test-dobs
  dob: {
    day: 1,
    month: 1,
    year: 1901,
  },
  email: "mike@brewer.com",
  phone: "+61255515678",
  first_name: "Mike",
  last_name: "Brewer",
  relationship: {
    title: "CEO",
    representative: true,
    executive: true,
    director: true,
    owner: true,
    percent_ownership: 100,
  },
};

const createAusAccount = async (name) => {
  const account = await stripe.accounts.create({
    ...successfulAccount,
    company: {
      ...successfulAccount.company,
      name,
    },
  });
  await stripe.accounts.createPerson(account.id, ceo);
  await stripe.accounts.update(account.id, {
    company: {
      directors_provided: true,
      owners_provided: true,
      executives_provided: true,
    },
  });
  return account;
};

const waitForAccountsVerified = async (accounts) => {
  for (const account of accounts) {
    const a = await stripe.accounts.retrieve(account.id);
    if (!_.isNil(a.requirements.disabled_reason)) {
      await delay(1000);
      await waitForAccountsVerified(accounts);
    }
  }
};
module.exports = { createAusAccount, waitForAccountsVerified };
