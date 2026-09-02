"use client";
import LegalPageLayout, { H2, P, UL, A } from "../../components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms &amp; Conditions" updated="September 2026">
      <P>
        These Terms &amp; Conditions ("Terms") govern your access to and use of Zalgo CRM, a lead and customer
        management platform operated by Zalgo Infotech ("Zalgo Infotech", "we", "us"). By creating an account or
        using Zalgo CRM, you agree to these Terms. If you do not agree, please do not use the service.
      </P>

      <H2>1. The Service</H2>
      <P>
        Zalgo CRM lets businesses capture and manage leads, fulfill customer orders, run outbound
        WhatsApp/Email/SMS automation, and connect third-party channels (Meta Ads, Google Ads, Google Sheets,
        WhatsApp, calls) and delivery couriers, subject to the features included in your subscribed plan.
      </P>

      <H2>2. Your Account</H2>
      <P>
        You're responsible for the accuracy of your account details and for keeping your login credentials
        confidential. Any activity under your account — including actions taken by employee logins you create — is
        your responsibility. Tell us immediately if you suspect unauthorized access.
      </P>

      <H2>3. Plans, Billing &amp; Free Trial</H2>
      <P>
        Zalgo CRM is offered on subscription plans (Basic, Pro, Pro Max, and Custom) billed monthly or yearly.
        Each plan defines limits on leads, customers, team members, and which features are available — upgrading
        or downgrading changes what you can access immediately. New accounts get a free trial period as shown at
        signup; no payment is required to start a trial, and it converts to a paid subscription only when you
        activate a plan. Prices are shown in the currency displayed at checkout and may change with notice for
        future billing cycles.
      </P>

      <H2>4. Cancellation &amp; Refunds</H2>
      <P>
        You can cancel your subscription at any time; cancellation stops future billing but does not refund the
        current paid period. See our <A href="/refund-policy">Refund &amp; Cancellation Policy</A> for full
        details.
      </P>

      <H2>5. Your Data</H2>
      <P>
        Leads, customers, orders, and other business data you enter into Zalgo CRM belong to you. We access it
        only to operate, secure, and support the service, as described in our{" "}
        <A href="/privacy">Privacy Policy</A>. If you cancel your account, we may retain data for a reasonable
        period as required by law or for legitimate backup purposes before deletion.
      </P>

      <H2>6. Third-Party Integrations</H2>
      <P>
        Features that connect to WhatsApp Cloud API, Meta Ads, Google Ads/Sheets, delivery couriers, or payment
        gateways depend on those third parties' own availability, terms, and API limits. You're responsible for
        holding valid, compliant accounts/credentials with those services and for how you use them (e.g. WhatsApp
        messaging must follow Meta's own policies).
      </P>

      <H2>7. Acceptable Use</H2>
      <P>You agree not to use Zalgo CRM to:</P>
      <UL>
        <li>Send unsolicited spam or messages that violate WhatsApp/Meta/SMS/email provider policies</li>
        <li>Upload unlawful, infringing, or harmful content</li>
        <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the platform</li>
        <li>Resell or sub-license the service without our written consent</li>
      </UL>

      <H2>8. Availability &amp; Changes</H2>
      <P>
        We aim to keep Zalgo CRM available and reliable but don't guarantee uninterrupted service — maintenance,
        third-party outages, or unforeseen issues can cause downtime. We may update features, pricing, or these
        Terms over time; material changes will be communicated where reasonably possible.
      </P>

      <H2>9. Limitation of Liability</H2>
      <P>
        Zalgo CRM is provided "as is." To the maximum extent permitted by law, Zalgo Infotech is not liable for
        indirect, incidental, or consequential damages arising from your use of the service, including losses
        related to third-party integrations outside our control.
      </P>

      <H2>10. Termination</H2>
      <P>
        We may suspend or terminate accounts that violate these Terms or applicable law. You may stop using the
        service and cancel your subscription at any time.
      </P>

      <H2>11. Governing Law</H2>
      <P>These Terms are governed by the laws of India.</P>

      <H2>12. Contact</H2>
      <P>
        Questions about these Terms? Reach us at <A href="mailto:zalgoinfotec@gmail.com">zalgoinfotec@gmail.com</A>{" "}
        or via our <A href="/contact">Contact page</A>.
      </P>
    </LegalPageLayout>
  );
}
