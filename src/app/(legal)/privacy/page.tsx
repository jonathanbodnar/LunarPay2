import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - LunarPay',
  description: 'LunarPay Privacy Policy - How we collect, use, and protect your information',
};

export default function PrivacyPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2026</p>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-600 mb-4">
            LunarPay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our payment processing platform and related services (collectively, the "Services").
          </p>
          <p className="text-gray-600">
            Please read this privacy policy carefully. By using our Services, you consent to the practices described in this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mb-3">Personal Information</h3>
          <p className="text-gray-600 mb-4">We may collect the following types of personal information:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
            <li>Name, email address, phone number, and mailing address</li>
            <li>Business information (business name, EIN, business address)</li>
            <li>Payment information (bank account details, credit card information)</li>
            <li>Government-issued identification for verification purposes</li>
            <li>Transaction history and payment records</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Automatically Collected Information</h3>
          <p className="text-gray-600 mb-4">When you access our Services, we automatically collect:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Process payments and transactions</li>
            <li>Create and manage your account</li>
            <li>Verify your identity and prevent fraud</li>
            <li>Communicate with you about your account and our Services</li>
            <li>Improve and optimize our Services</li>
            <li>Comply with legal and regulatory requirements</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
          <p className="text-gray-600 mb-4">We may share your information with:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Payment processors:</strong> To process transactions on your behalf</li>
            <li><strong>Service providers:</strong> Third parties who help us operate our Services</li>
            <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
            <li><strong>Business partners:</strong> With your consent for integrated services</li>
          </ul>
          <p className="text-gray-600 mt-4">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
          <p className="text-gray-600 mb-4">
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>SSL/TLS encryption for data in transit</li>
            <li>AES-256 encryption for data at rest</li>
            <li>PCI DSS compliance for payment data</li>
            <li>Regular security audits and penetration testing</li>
            <li>Multi-factor authentication options</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
          <p className="text-gray-600 mb-4">Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability</li>
            <li>Withdraw consent where applicable</li>
          </ul>
          <p className="text-gray-600 mt-4">
            To exercise these rights, please contact us at privacy@lunarpay.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
          <p className="text-gray-600">
            We retain your personal information for as long as necessary to provide our Services and comply with legal obligations. Transaction records are retained for a minimum of 7 years as required by financial regulations. You may request deletion of your account data, subject to legal retention requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies</h2>
          <p className="text-gray-600 mb-4">
            We use cookies and similar technologies to enhance your experience. Types of cookies we use:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Essential cookies:</strong> Required for basic functionality</li>
            <li><strong>Analytics cookies:</strong> Help us understand how you use our Services</li>
            <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
          </ul>
          <p className="text-gray-600 mt-4">
            You can manage cookie preferences through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
          <p className="text-gray-600">
            Our Services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our Services after such changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have questions or concerns about this Privacy Policy, please contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
            <p><strong>LunarPay</strong></p>
            <p>Email: privacy@lunarpay.com</p>
            <p>Support: support@lunarpay.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}

