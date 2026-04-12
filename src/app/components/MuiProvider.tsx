'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#edf1f5',
      paper: 'rgba(255, 255, 255, 0.62)',
    },
    primary: {
      main: '#11161d',
    },
    secondary: {
      main: '#5e6b7d',
    },
    text: {
      primary: '#11161d',
      secondary: 'rgba(25, 33, 44, 0.66)',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Space Grotesk", "Manrope", "Inter", sans-serif',
    button: {
      textTransform: 'none',
      letterSpacing: 0.25,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(1200px 700px at 85% -10%, rgba(118, 154, 194, 0.22), transparent 52%), radial-gradient(1000px 650px at -15% 10%, rgba(183, 203, 224, 0.38), transparent 48%), #edf1f5',
          color: '#11161d',
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(167, 179, 195, 0.25)',
          boxShadow: '0 12px 24px rgba(9, 16, 26, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.78), rgba(243, 248, 255, 0.66))',
          border: '1px solid rgba(157, 174, 192, 0.2)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 14px 24px rgba(17, 25, 39, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 252, 255, 0.76))',
          borderBottom: '1px solid rgba(157, 174, 192, 0.26)',
          boxShadow: 'none',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(160deg, rgba(248, 251, 255, 0.95), rgba(237, 242, 248, 0.92))',
          borderRight: '1px solid rgba(157, 174, 192, 0.24)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
        contained: {
          color: '#f6f9fd',
          background: 'linear-gradient(135deg, #202833, #3a4a5f)',
        },
        outlined: {
          borderColor: 'rgba(114, 131, 150, 0.26)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(249, 252, 255, 0.7)',
            borderRadius: 12,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(122, 138, 158, 0.15)',
        },
      },
    },
  },
});

interface MuiProviderProps {
  children: ReactNode;
}

export default function MuiProvider({ children }: MuiProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
