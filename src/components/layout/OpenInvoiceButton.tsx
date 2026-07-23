'use client';

import { FileText } from 'lucide-react';

// Base URL of the invoice app. Dev default = http://localhost:3002.
const INVOICE_URL = process.env.NEXT_PUBLIC_INVOICE_URL || 'http://localhost:3002';

/**
 * Opens the invoice system in a new tab, already authenticated (SSO).
 *
 * We POST the admin's tour-api Sanctum token to the invoice `/api/auth/sso`
 * endpoint via a form submit (keeps the token out of the URL / history). The
 * invoice verifies the token against tour-api, sets its own session cookie, and
 * redirects to its dashboard — so the user does not have to log in again.
 */
export function OpenInvoiceButton() {
  const openInvoice = () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      // No admin session — just open the invoice login page.
      window.open(`${INVOICE_URL}/login`, '_blank', 'noopener');
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${INVOICE_URL}/api/auth/sso`;
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token';
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <button
      type="button"
      onClick={openInvoice}
      title="เปิดระบบ Invoice"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
    >
      <FileText className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline">Invoice</span>
    </button>
  );
}
