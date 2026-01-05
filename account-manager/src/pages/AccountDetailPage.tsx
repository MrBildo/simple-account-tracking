import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { AccountForm } from '../components/AccountForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { buildDraftFromAccount, buildEmptyDraft, type AccountDraft } from '../lib/accountDraft'
import type { AccountRecord } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

export function AccountDetailPage() {
  const { id } = useParams()
  return <AccountDetailInner key={id ?? 'new'} id={id ?? 'new'} />
}

function AccountDetailInner(props: { id: string }) {
  const id = props.id
  const navigate = useNavigate()
  const { accounts, addAccount, updateAccount, deleteAccount } = useAppStore()

  const mode: 'new' | 'edit' = id === 'new' ? 'new' : 'edit'
  const existing = useMemo(
    () => (mode === 'edit' ? accounts.find((a) => a.id === id) : undefined),
    [accounts, id, mode],
  )

  const [draft, setDraft] = useState<AccountDraft>(() =>
    existing ? buildDraftFromAccount(existing) : buildEmptyDraft(),
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (mode === 'edit' && !existing) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" fontWeight={900}>
            Account not found
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            It may have been deleted or you imported a different data file.
          </Typography>
          <Button component={RouterLink} to="/accounts" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
            Back to Accounts
          </Button>
        </CardContent>
      </Card>
    )
  }

  const title = mode === 'new' ? 'New account' : existing!.accountName

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }} mb={2}>
        <Button component={RouterLink} to="/accounts" variant="text" startIcon={<ArrowBackIcon />}>
          Accounts
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={900}>
            {title}
          </Typography>
          <Typography color="text.secondary">
            {mode === 'new' ? 'Add a new account.' : 'View and edit details.'}
          </Typography>
        </Box>
        {mode === 'edit' ? (
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        ) : null}
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <AccountForm
            mode={mode}
            existing={existing}
            draft={draft}
            onDraftChange={setDraft}
            onSave={async (updates: Partial<AccountRecord>) => {
              if (mode === 'new') {
                const newId = addAccount({
                  accountName: updates.accountName ?? '',
                  type: (updates.type as AccountRecord['type']) ?? 'Credit Card',
                  accountNumber: updates.accountNumber ?? '',
                  currentBalance: updates.currentBalance ?? 0,
                  currentCardNumber: updates.currentCardNumber,
                  creditLimit: updates.creditLimit,
                  openDate: updates.openDate,
                  interestRateApr: updates.interestRateApr,
                  serviceFeeAmount: updates.serviceFeeAmount,
                  serviceFeeFrequency: updates.serviceFeeFrequency,
                  actualLastMinPayment: updates.actualLastMinPayment,
                  loginUrl: updates.loginUrl,
                  username: updates.username,
                  passwordEnc: updates.passwordEnc,
                  notes: updates.notes,
                })
                navigate(`/accounts/${newId}`, { replace: true })
              } else {
                updateAccount(existing!.id, updates)
              }
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete account?"
        description="This will permanently remove the account from local storage (unless you have an export backup)."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteAccount(existing!.id)
          setConfirmDelete(false)
          navigate('/accounts')
        }}
      />
    </Box>
  )
}

