const moment = require("moment");
const stripe = require("./stripe").secretKeyStripe;
const { prettyPrint, keypress } = require("./common");
const {
  createAusAccount,
  waitForAccountsVerified,
} = require("./createConnectAccount");

const defaultPayment = {
  amount: 10000,
  currency: "aud",
  payment_method_types: ["card"],
  payment_method: "pm_card_bypassPending", //test card!
  confirm: true,
  statement_descriptor: "Tix Fes",
};

const transferUrl = (transferId) =>
  `https://dashboard.stripe.com/test/connect/transfers/${transferId}`;

const updatePaymentIntentWithTransfers = async (
  paymentIntent,
  transfer1,
  transfer2
) => {
  await stripe.paymentIntents.update(paymentIntent.id, {
    metadata: {
      transfer_1: transferUrl(transfer1.id),
      transfer_2: transfer2 && transferUrl(transfer2.id),
    },
  });
};

(async () => {
  try {
    const account1 = await createAusAccount("Supplier 1 (AUD)");
    const account2 = await createAusAccount("Supplier 2 (AUD)");
    console.log("Created Connect Accounts!");
    // console.log("Waiting for accounts to verified....");
    // await waitForAccountsVerified([account1, account2]);
    // console.log("Accounts verified!");
    const zero_a = "0.a payment in GBP stays in platform as GBP";
    console.log(zero_a);
    await stripe.paymentIntents.create({
      ...defaultPayment,
      amount: 10000,
      currency: "gbp",
      description: zero_a,
    });

    // Scenario 1
    const one_a = "1.a collect in platform account in GBP";
    console.log(one_a);
    await stripe.paymentIntents.create({
      ...defaultPayment,
      description: one_a,
    });

    const one_b = "1.b collect in platform account in GBP and transfer";
    console.log(one_b);
    const pi_1b = await stripe.paymentIntents.create({
      ...defaultPayment,
      description: one_b,
    });
    const t_1b = await stripe.transfers.create({
      amount: 9000,
      currency: "gbp",
      destination: account1.id,
      description: one_b,
    });
    await updatePaymentIntentWithTransfers(pi_1b, t_1b);

    const one_c = "1.c on_behalf_of";
    console.log(one_c);
    await stripe.paymentIntents.create({
      ...defaultPayment,
      on_behalf_of: account1.id,
      description: one_c,
    });

    const one_d = "1.d on_behalf_of and transfer";
    console.log(one_d);
    const pi_1d = await stripe.paymentIntents.create({
      ...defaultPayment,
      on_behalf_of: account1.id,
      description: one_d,
    });
    const t_1d = await stripe.transfers.create({
      amount: 9000,
      currency: "aud",
      destination: account1.id,
      description: one_d,
    });

    await updatePaymentIntentWithTransfers(pi_1d, t_1d);

    // Scenario 2

    const two_b = "2.b collect in platform account in GBP and transfer";
    console.log(two_b);
    const pi_2b = await stripe.paymentIntents.create({
      ...defaultPayment,
      amount: 10000,
      currency: "gbp",
      description: two_b,
    });
    const t_2b = await stripe.transfers.create({
      amount: 15000,
      currency: "aud",
      destination: account1.id,
      description: two_b,
    });
    await updatePaymentIntentWithTransfers(pi_2b, t_2b);

    const two_c = "2.c on_behalf_of";
    console.log(two_c);
    await stripe.paymentIntents.create({
      ...defaultPayment,
      on_behalf_of: account1.id,
      amount: 10000,
      currency: "gbp",
      description: two_c,
    });

    const two_d = "2.d on_behalf_of and transfer";
    console.log(two_d);
    const pi_2d = await stripe.paymentIntents.create({
      ...defaultPayment,
      on_behalf_of: account1.id,
      amount: 10000,
      currency: "gbp",
      description: two_d,
    });
    const t_2d = await stripe.transfers.create({
      amount: 5000,
      currency: "aud",
      destination: account1.id,
      description: two_d,
    });
    await updatePaymentIntentWithTransfers(pi_2d, t_2d);

    const four_d = "4.d on_behalf_of and transfer";
    console.log(four_d);
    const pi_4d = await stripe.paymentIntents.create({
      ...defaultPayment,
      on_behalf_of: account1.id,
      amount: 10000,
      currency: "aud",
      description: four_d,
    });
    const t_4d = await stripe.transfers.create({
      amount: 2500,
      currency: "aud",
      destination: account1.id,
      description: four_d,
    });
    const t_4d_1 = await stripe.transfers.create({
      amount: 2500,
      currency: "aud",
      destination: account2.id,
      description: four_d,
    });
    await updatePaymentIntentWithTransfers(pi_4d, t_4d, t_4d_1);
  } catch (error) {
    console.error(error);
  }
})();
