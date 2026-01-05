import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { decryptString } from '../lib/crypto'
import { accountsToCsv, downloadTextFile } from '../lib/csv'
import { buildExportFile, parseImportedFile } from '../lib/storage'
import { AccountsTable } from '../components/AccountsTable'
import { useAppStore } from '../store/useAppStore'

export function AccountsPage() {
  const { accounts, replaceAllAccounts, vault, vaultPassword } = useAppStore()
  const [query, setQuery] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [includePasswords, setIncludePasswords] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter((a) => {
      return (
        a.accountName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      )
    })
  }, [accounts, query])

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2} mb={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={900}>
            Accounts
          </Typography>
          <Typography color="text.secondary">Create, view, and edit your accounts.</Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => setExportOpen(true)}>
            Export
          </Button>
          <Button component={RouterLink} to="/accounts/new" startIcon={<AddIcon />}>
            Add account
          </Button>
        </Stack>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              setImportError(null)
              const text = await file.text()
              const imported = parseImportedFile(text)
              replaceAllAccounts(imported)
            } catch (err) {
              setImportError(err instanceof Error ? err.message : 'Import failed.')
            }
          }}
        />
      </Stack>

      {importError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {importError}
        </Alert>
      ) : null}

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems={{ sm: 'center' }}>
            <TextField
              label="Search"
              placeholder="Name, number, type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: 360 } }}
              inputProps={{ autoComplete: 'off' }}
            />
            <Typography variant="body2" color="text.secondary">
              Showing {filtered.length} of {accounts.length}
            </Typography>
          </Stack>

          <AccountsTable accounts={filtered} />
        </CardContent>
      </Card>

      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography color="text.secondary">
              JSON preserves encrypted passwords. CSV is easiest to open in Excel.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={includePasswords}
                  onChange={(e) => setIncludePasswords(e.target.checked)}
                  disabled={vault.status !== 'unlocked'}
                />
              }
              label="Include decrypted passwords in CSV (requires vault unlocked)"
            />
            {includePasswords && vault.status !== 'unlocked' ? (
              <Alert severity="warning">Unlock the vault first to export decrypted passwords.</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setExportOpen(false)}>
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const file = buildExportFile(accounts)
              downloadTextFile({
                contents: JSON.stringify(file, null, 2),
                filename: `accounts-export-${new Date().toISOString().slice(0, 10)}.json`,
                mime: 'application/json',
              })
            }}
          >
            Export JSON
          </Button>
          <Button
            onClick={async () => {
              const decrypted: Record<string, string | undefined> = {}
              if (includePasswords && vault.status === 'unlocked' && vaultPassword) {
                for (const a of accounts) {
                  if (!a.passwordEnc) continue
                  try {
                    decrypted[a.id] = await decryptString(a.passwordEnc, vaultPassword)
                  } catch {
                    decrypted[a.id] = '[decrypt failed]'
                  }
                }
              }

              const csv = accountsToCsv({ accounts, decryptedPasswordsById: includePasswords ? decrypted : undefined })
              downloadTextFile({
                contents: csv,
                filename: `accounts-export-${new Date().toISOString().slice(0, 10)}.csv`,
                mime: 'text/csv',
              })
              setExportOpen(false)
            }}
          >
            Export CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

