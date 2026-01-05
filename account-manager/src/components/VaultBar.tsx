import { Box, Button, Chip, Stack, TextField, Tooltip, Typography } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export function VaultBar() {
  const { vault, unlockVault, lockVault } = useAppStore()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)

  const isUnlocked = vault.status === 'unlocked'

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {isUnlocked ? (
        <>
          <Chip
            size="small"
            icon={<LockOpenIcon />}
            label="Vault unlocked"
            color="success"
            variant="outlined"
          />
          <Button
            variant="text"
            color="inherit"
            onClick={() => {
              setPw('')
              lockVault()
            }}
          >
            Lock
          </Button>
        </>
      ) : (
        <>
          <Chip
            size="small"
            icon={<LockIcon />}
            label="Vault locked"
            color="warning"
            variant="outlined"
          />
          <Box sx={{ width: 240 }}>
            <TextField
              fullWidth
              size="small"
              type="password"
              value={pw}
              placeholder="Vault password"
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  setBusy(true)
                  await unlockVault(pw)
                  setBusy(false)
                }
              }}
              autoComplete="current-password"
              inputProps={{ 'aria-label': 'Vault password' }}
              error={Boolean(vault.error)}
              helperText={vault.error || 'Required to view/save account passwords.'}
            />
          </Box>
          <Tooltip title="Unlock vault">
            <span>
              <Button
                disabled={!pw || busy}
                variant="outlined"
                color="inherit"
                onClick={async () => {
                  setBusy(true)
                  await unlockVault(pw)
                  setBusy(false)
                }}
              >
                Unlock
              </Button>
            </span>
          </Tooltip>
        </>
      )}
      <Typography variant="caption" sx={{ opacity: 0.8, display: { xs: 'none', md: 'block' } }}>
        Passwords are encrypted locally in your browser.
      </Typography>
    </Stack>
  )
}

