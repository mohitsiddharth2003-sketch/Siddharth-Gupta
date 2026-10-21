import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onNewInvoice?: () => void;
  onNewPurchase?: () => void;
  onNewExpense?: () => void;
  onOpenParties?: () => void;
  onOpenDashboard?: () => void;
  onOpenSales?: () => void;
  onOpenGST?: () => void;
  onOpenTDS?: () => void;
  onOpenBank?: () => void;
  onOpenLedgers?: () => void;
  onOpenReports?: () => void;
  onOpenEInvoice?: () => void;
  onOpenEWayBill?: () => void;
  onOpenSettings?: () => void;
  onSave?: () => void;
  onOpenShortcuts?: () => void;
  onBackup?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const {
    onNewInvoice,
    onNewPurchase,
    onNewExpense,
    onOpenParties,
    onOpenDashboard,
    onOpenSales,
    onOpenGST,
    onOpenTDS,
    onOpenBank,
    onOpenLedgers,
    onOpenReports,
    onOpenEInvoice,
    onOpenEWayBill,
    onOpenSettings,
    onSave,
    onOpenShortcuts,
    onBackup,
    onEscape,
    enabled = true,
  } = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. ESCAPE: Close active modal or cancel
      if (e.key === 'Escape') {
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        return;
      }

      // 2. HELP: '?' when not typing inside an input
      if (!isModifier && e.key === '?' && !isInput) {
        if (onOpenShortcuts) {
          e.preventDefault();
          onOpenShortcuts();
        }
        return;
      }

      // 3. CTRL / CMD SHORTCUTS
      if (isModifier) {
        // Ctrl + /: Toggle shortcuts modal
        if (e.key === '/' || e.code === 'Slash') {
          e.preventDefault();
          onOpenShortcuts?.();
          return;
        }

        // Ctrl + Shift + B: Download statutory full backup
        if (e.shiftKey && key === 'b') {
          e.preventDefault();
          onBackup?.();
          return;
        }

        // Ctrl + S: Save active voucher form or trigger primary save
        if (key === 's') {
          e.preventDefault();
          e.stopPropagation();

          // Check if there is an active visible modal with a form to submit
          const activeModals = document.querySelectorAll(
            '[role="dialog"], .fixed.inset-0, .modal-container'
          );
          let formSubmitted = false;

          if (activeModals.length > 0) {
            // Find top-most modal
            const topModal = activeModals[activeModals.length - 1];
            const form = topModal.querySelector('form');
            if (form) {
              const submitBtn = form.querySelector(
                'button[type="submit"], input[type="submit"]'
              ) as HTMLButtonElement | null;
              if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
                formSubmitted = true;
              } else if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
                formSubmitted = true;
              }
            }
          }

          if (!formSubmitted && onSave) {
            onSave();
          }
          return;
        }

        // Ctrl + N: New Sales Invoice
        if (key === 'n') {
          e.preventDefault();
          onNewInvoice?.();
          return;
        }

        // Ctrl + P: Parties Master (Customer & Vendor directory)
        if (key === 'p') {
          e.preventDefault();
          onOpenParties?.();
          return;
        }

        // Ctrl + B: New Purchase Bill
        if (key === 'b') {
          e.preventDefault();
          onNewPurchase?.();
          return;
        }

        // Ctrl + Shift + E: E-Invoice Portal
        if (e.shiftKey && key === 'e') {
          e.preventDefault();
          onOpenEInvoice?.();
          return;
        }

        // Ctrl + Shift + W: E-Way Bill Portal
        if (e.shiftKey && key === 'w') {
          e.preventDefault();
          onOpenEWayBill?.();
          return;
        }

        // Ctrl + E: New Expense Voucher (when Shift is not pressed)
        if (key === 'e') {
          e.preventDefault();
          onNewExpense?.();
          return;
        }

        // Ctrl + D: Dashboard Overview
        if (key === 'd') {
          e.preventDefault();
          onOpenDashboard?.();
          return;
        }

        // Ctrl + I: Sales Invoices Module
        if (key === 'i') {
          e.preventDefault();
          onOpenSales?.();
          return;
        }

        // Ctrl + G: GST Manager & Returns
        if (key === 'g') {
          e.preventDefault();
          onOpenGST?.();
          return;
        }

        // Ctrl + T: TDS Compliance Manager
        if (key === 't') {
          e.preventDefault();
          onOpenTDS?.();
          return;
        }

        // Ctrl + K: Bank Reconciliation (BRS)
        if (key === 'k') {
          e.preventDefault();
          onOpenBank?.();
          return;
        }

        // Ctrl + L or Ctrl + J: Ledgers & Journals
        if (key === 'l' || key === 'j') {
          e.preventDefault();
          onOpenLedgers?.();
          return;
        }

        // Ctrl + R: Financial Reports
        if (key === 'r') {
          // If shift is also held (Ctrl+Shift+R), let browser hard refresh
          if (!e.shiftKey) {
            e.preventDefault();
            onOpenReports?.();
            return;
          }
        }

        // Ctrl + M or Ctrl + ,: Settings
        if (key === 'm' || key === ',') {
          e.preventDefault();
          onOpenSettings?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    enabled,
    onNewInvoice,
    onNewPurchase,
    onNewExpense,
    onOpenParties,
    onOpenDashboard,
    onOpenSales,
    onOpenGST,
    onOpenTDS,
    onOpenBank,
    onOpenLedgers,
    onOpenReports,
    onOpenEInvoice,
    onOpenEWayBill,
    onOpenSettings,
    onSave,
    onOpenShortcuts,
    onBackup,
    onEscape,
  ]);
}
