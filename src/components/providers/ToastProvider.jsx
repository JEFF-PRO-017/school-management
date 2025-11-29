'use client';

/**
 * Toast Provider avec notistack (Material-UI)
 * Configuration globale des notifications
 */

import { SnackbarProvider } from 'notistack';

export default function ToastProvider({ children }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={4000}
      preventDuplicate
      dense={false}
      // Styles personnalisés
      classes={{
        containerRoot: 'z-[9999]',
      }}
      // Variantes avec styles Material-UI
      variant="default"
    >
      {children}
    </SnackbarProvider>
  );
}