import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - LunarPay',
  description: 'LunarPay Terms of Use - Rules and guidelines for using our payment processing services',
};

export default function TermsPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2026</p>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            Welcome to LunarPay. These Terms of Use ("Terms") govern your access to and use of LunarPay's payment processing platform, including our website, applications, APIs, and related services (collectively, the "Services").
          </p>
          <p className="text-gray-600">
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
          <p className="text-gray-600 mb-4">To use our Services, you must:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Be at least 18 years old</li>
            <li>Have the legal capacity to enter into a binding agreement</li>
            <li>Be a resident of a jurisdiction where our Services are available</li>
            <li>Provide accurate and complete registration information</li>
            <li>Not be prohibited from using payment services under applicable laws</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
          <p className="text-gray-600 mb-4">
            To access certain features of our Services, you must create an account. When creating an account, you agree to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information as necessary</li>
            <li>Keep your login credentials secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Payment Processing Services</h2>
          <p className="text-gray-600 mb-4">
            LunarPay provides payment processing services that enable you to accept payments from your customers. By using our payment services, you agree that:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>You will only process legitimate transactions for goods or services you provide</li>
            <li>You will comply with all applicable payment network rules and regulations</li>
            <li>You will maintain proper records of all transactions</li>
            <li>You will handle customer disputes and refunds appropriately</li>
            <li>You will not process prohibited transactions (see Section 5)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
          <p className="text-gray-600 mb-4">You may not use our Services to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Process transactions for illegal goods or services</li>
            <li>Engage in fraudulent or deceptive practices</li>
            <li>Process transactions without proper authorization</li>
            <li>Violate any applicable laws, regulations, or third-party rights</li>
            <li>Transmit malware, viruses, or harmful code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Process transactions for gambling, adult content, or controlled substances (unless explicitly approved)</li>
            <li>Engage in money laundering or terrorist financing</li>
            <li>Process transactions that violate payment network rules</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Fees and Payments</h2>
          <p className="text-gray-600 mb-4">
            Our fee structure is provided during registration and may be updated from time to time. By using our Services, you agree to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Pay all applicable fees as described in your pricing agreement</li>
            <li>Authorize us to deduct fees from your transaction proceeds</li>
            <li>Maintain sufficient funds in your account to cover fees and chargebacks</li>
            <li>Accept that fees are non-refundable unless otherwise stated</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Payouts and Reserves</h2>
          <p className="text-gray-600 mb-4">
            Transaction proceeds will be deposited to your designated bank account according to our payout schedule. We reserve the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Hold funds for risk mitigation purposes</li>
            <li>Establish reserve requirements based on your risk profile</li>
            <li>Delay or suspend payouts if suspicious activity is detected</li>
            <li>Deduct chargebacks, refunds, and fees from your balance</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Chargebacks and Disputes</h2>
          <p className="text-gray-600 mb-4">
            You are responsible for managing customer disputes and chargebacks. You agree to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Respond promptly to chargeback notifications</li>
            <li>Provide documentation to support dispute resolution</li>
            <li>Accept financial responsibility for chargebacks</li>
            <li>Maintain chargeback rates within acceptable limits</li>
            <li>Cooperate with our fraud prevention efforts</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
          <p className="text-gray-600">
            All content, trademarks, and intellectual property on our Services are owned by LunarPay or our licensors. You may not use, reproduce, or distribute any content without our express written permission. You retain ownership of your data and content that you submit to our Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Privacy</h2>
          <p className="text-gray-600">
            Your use of our Services is also governed by our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>, which describes how we collect, use, and protect your information. By using our Services, you consent to our data practices as described in the Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Disclaimer of Warranties</h2>
          <p className="text-gray-600">
            OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
          <p className="text-gray-600">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUNARPAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS SHALL NOT EXCEED THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Indemnification</h2>
          <p className="text-gray-600">
            You agree to indemnify, defend, and hold harmless LunarPay, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of our Services, your violation of these Terms, or your violation of any third-party rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Termination</h2>
          <p className="text-gray-600 mb-4">
            Either party may terminate this agreement at any time. We may suspend or terminate your access to our Services immediately if:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>You violate these Terms or any applicable laws</li>
            <li>We detect fraudulent or suspicious activity</li>
            <li>Your chargeback rate exceeds acceptable limits</li>
            <li>Required by law or payment network rules</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Upon termination, you remain responsible for all outstanding obligations, including fees and chargebacks.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Modifications</h2>
          <p className="text-gray-600">
            We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of our Services after such changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Governing Law</h2>
          <p className="text-gray-600">
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the state or federal courts located in Delaware.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Miscellaneous</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and LunarPay regarding our Services.</li>
            <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions will continue in effect.</li>
            <li><strong>Waiver:</strong> Our failure to enforce any right does not constitute a waiver of that right.</li>
            <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">18. Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have questions about these Terms, please contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
            <p><strong>LunarPay</strong></p>
            <p>Email: legal@lunarpay.com</p>
            <p>Support: support@lunarpay.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}

