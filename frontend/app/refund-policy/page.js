"use client";
import LegalPageLayout, { H2, P, UL, A } from "../../components/LegalPageLayout";

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund &amp; Cancellation Policy" updated="September 2026">
      <P>This policy covers free trials, subscription cancellation, and refunds for Zalgo CRM.</P>

      <H2>1. Free Trial</H2>
      <P>
        New accounts start on a free trial — no payment is taken and no charges apply until you actively activate
        a paid plan. You can use or cancel during the trial with no cost.
      </P>

      <H2>2. Cancellation</H2>
      <P>
        You can cancel your subscription at any time from within the CRM or by contacting us. Cancelling stops
        future billing — your plan stays active until the end of the period you've already paid for, after which
        it won't renew.
      </P>

      <H2>3. Refunds</H2>
      <P>
        Subscription payments are <strong>non-refundable</strong>, including for partially used billing periods,
        downgrades, or unused features. This applies to both monthly and yearly billing cycles.
      </P>

      <H2>4. Billing Errors</H2>
      <P>
        If you believe you were charged incorrectly (e.g. a duplicate charge or a charge after cancellation), let
        us know within 7 days of the charge and we'll review and correct genuine billing errors.
      </P>

      <H2>5. Custom Plans</H2>
      <P>
        Custom plans are set up individually after you contact us, so their billing and cancellation terms are
        confirmed with you directly at the time of setup.
      </P>

      <H2>6. Contact</H2>
      <P>
        For billing questions, reach us at <A href="mailto:zalgoinfotec@gmail.com">zalgoinfotec@gmail.com</A> or
        via our <A href="/contact">Contact page</A>.
      </P>
    </LegalPageLayout>
  );
}
