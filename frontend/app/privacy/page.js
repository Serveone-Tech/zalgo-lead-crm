"use client";
import LegalPageLayout, { H2, P, UL, A } from "../../components/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="September 2026">
      <P>
        This Privacy Policy explains how Zalgo Infotech ("we", "us") collects, uses, and protects information
        when you use Zalgo CRM.
      </P>

      <H2>1. Information We Collect</H2>
      <P>We collect:</P>
      <UL>
        <li>
          <strong>Account information</strong> — your name, email, phone, and business/organisation details
          provided at signup.
        </li>
        <li>
          <strong>Business data you enter</strong> — leads, customers, orders, notes, and files (e.g. payment
          screenshots) you or your team add while using the platform.
        </li>
        <li>
          <strong>Integration data</strong> — leads/messages pulled in from channels you connect (WhatsApp,
          Meta Ads, Google Ads/Sheets, calls), using credentials you provide.
        </li>
        <li>
          <strong>Usage &amp; billing information</strong> — login activity, subscription/plan status, and
          payment records from our payment processor.
        </li>
      </UL>

      <H2>2. How We Use It</H2>
      <P>We use this information to:</P>
      <UL>
        <li>Operate the core service — store and display your leads, customers, and orders</li>
        <li>Send automated messages/emails/SMS you configure to your own customers</li>
        <li>Process subscription billing and send related notifications (trial ending, renewal, receipts)</li>
        <li>Provide support and respond to requests you send us</li>
        <li>Maintain security and prevent misuse of the platform</li>
      </UL>

      <H2>3. Data Storage &amp; Security</H2>
      <P>
        Your data is stored on encrypted, managed cloud infrastructure (PostgreSQL hosting) with access restricted
        to what's needed to operate the service. Passwords are stored hashed, never in plain text. Files you
        upload (e.g. order attachments) are stored on our servers and served over HTTPS.
      </P>

      <H2>4. Third-Party Services</H2>
      <P>
        Depending on which features and integrations you enable, your data may pass through: WhatsApp Cloud API
        and Meta Ads (Meta Platforms), Google Ads/Sheets (Google), delivery courier APIs (e.g. Delhivery,
        Shiprocket), email delivery (via our transactional mailer), SMS providers, and our payment gateway for
        processing subscription payments. These providers process data under their own privacy policies as
        needed to deliver the feature you enabled.
      </P>

      <H2>5. Data Sharing</H2>
      <P>
        We don't sell your data. We share it only with the third-party services above (as needed to run features
        you've turned on), with our infrastructure providers (for hosting), or when required by law.
      </P>

      <H2>6. Data Retention</H2>
      <P>
        We keep your data for as long as your account is active. If you cancel, we may retain it for a reasonable
        period afterward for backup/legal purposes before deletion. You can request earlier deletion by
        contacting us.
      </P>

      <H2>7. Your Rights</H2>
      <P>
        You can access, correct, export, or request deletion of your account's data at any time by contacting us
        at <A href="mailto:zalgoinfotec@gmail.com">zalgoinfotec@gmail.com</A>. Note that data you've entered
        about your own customers/leads is yours to manage directly within the CRM.
      </P>

      <H2>8. Cookies &amp; Local Storage</H2>
      <P>
        Zalgo CRM uses browser local storage to keep you signed in and remember your preferences (like theme) — we
        don't use third-party advertising trackers.
      </P>

      <H2>9. Children's Privacy</H2>
      <P>Zalgo CRM is a business tool and isn't directed at or knowingly used by children.</P>

      <H2>10. Changes to This Policy</H2>
      <P>We may update this policy from time to time; the "Last updated" date above reflects the latest revision.</P>

      <H2>11. Contact</H2>
      <P>
        Questions about this policy? Email <A href="mailto:zalgoinfotec@gmail.com">zalgoinfotec@gmail.com</A> or
        use our <A href="/contact">Contact page</A>.
      </P>
    </LegalPageLayout>
  );
}
