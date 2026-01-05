import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useMemo, useState } from 'react'
import type { AccountRecord, AccountType } from '../lib/types'
import type { AccountDraft } from '../lib/accountDraft'
import { parseCreditCardNumber } from '../lib/card'
import { decryptString, encryptString } from '../lib/crypto'
import { availableCredit, estimateMinPayment, formatMoney, openDateAgeLabel, payoffEstimate } from '../lib/math'
import { useAppStore } from '../store/useAppStore'

const ACCOUNT_TYPES: AccountType[] = [
  'Credit Card',
  'Service',
  'Streaming',
  'Loan',
  'Bank',
  'Investment',
  'Other',
]

function toNumberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export function AccountForm(props: {
  mode: 'new' | 'edit'
  existing?: AccountRecord
  draft: AccountDraft
  onDraftChange: (next: AccountDraft) => void
  onSave: (updates: Partial<AccountRecord>) => Promise<void> | void
}) {
  const { vault, vaultPassword } = useAppStore()

  const [pwBusy, setPwBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordPlain, setPasswordPlain] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const balanceNum = toNumberOrUndefined(props.draft.currentBalance) ?? 0
  const creditLimitNum = toNumberOrUndefined(props.draft.creditLimit)
  const availCredit = useMemo(() => {
    if (creditLimitNum == null) return undefined
    return availableCredit({ creditLimit: creditLimitNum, currentBalance: balanceNum })
  }, [balanceNum, creditLimitNum])
  const aprNum = toNumberOrUndefined(props.draft.interestRateApr)
  const actualMinNum = toNumberOrUndefined(props.draft.actualLastMinPayment)
  const estimatedMin = estimateMinPayment(balanceNum)
  const paymentForMath = actualMinNum ?? estimatedMin

  const payoff = useMemo(
    () =>
      payoffEstimate({
        balance: balanceNum,
        aprPercent: aprNum,
        monthlyPayment: paymentForMath,
      }),
    [balanceNum, aprNum, paymentForMath],
  )

  const ageLabel = openDateAgeLabel(props.draft.openDate)
  const cardParsed = useMemo(() => parseCreditCardNumber(props.draft.currentCardNumber), [props.draft.currentCardNumber])

  async function revealExistingPassword() {
    if (!props.existing?.passwordEnc) return
    if (vault.status !== 'unlocked' || !vaultPassword) {
      setPasswordError('Unlock the vault first to view passwords.')
      return
    }
    setPwBusy(true)
    setPasswordError(null)
    try {
      const plain = await decryptString(props.existing.passwordEnc, vaultPassword)
      setPasswordPlain(plain)
      setShowPassword(true)
    } catch {
      setPasswordError('Unable to decrypt with current vault password.')
    } finally {
      setPwBusy(false)
    }
  }

  async function save() {
    setPasswordError(null)
    const updates: Partial<AccountRecord> = {
      accountName: props.draft.accountName.trim(),
      type: props.draft.type,
      accountNumber: props.draft.accountNumber.trim(),
      currentCardNumber: props.draft.currentCardNumber.trim() || undefined,
      creditLimit: toNumberOrUndefined(props.draft.creditLimit),
      openDate: props.draft.openDate.trim() || undefined,
      interestRateApr: toNumberOrUndefined(props.draft.interestRateApr),
      serviceFeeAmount: toNumberOrUndefined(props.draft.serviceFeeAmount),
      serviceFeeFrequency: props.draft.serviceFeeAmount.trim()
        ? props.draft.serviceFeeFrequency
        : undefined,
      currentBalance: toNumberOrUndefined(props.draft.currentBalance) ?? 0,
      actualLastMinPayment: toNumberOrUndefined(props.draft.actualLastMinPayment),
      loginUrl: props.draft.loginUrl.trim() || undefined,
      username: props.draft.username.trim() || undefined,
      notes: props.draft.notes.trim() || undefined,
    }

    // Password handling: only update if user typed something.
    if (passwordPlain.trim()) {
      if (vault.status !== 'unlocked' || !vaultPassword) {
        setPasswordError('Unlock the vault before saving a password.')
        return
      }
      try {
        updates.passwordEnc = await encryptString(passwordPlain, vaultPassword)
      } catch {
        setPasswordError('Unable to encrypt with current vault password.')
        return
      }
    }

    await props.onSave(updates)
  }

  const requiredMissing =
    !props.draft.accountName.trim() ||
    !props.draft.type ||
    !props.draft.accountNumber.trim() ||
    !props.draft.currentBalance.trim()

  return (
    <Box>
      {requiredMissing ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Fields marked with * are required.
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={900}>
              Account details
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  label="Account Name *"
                  value={props.draft.accountName}
                  onChange={(e) => props.onDraftChange({ ...props.draft, accountName: e.target.value })}
                  fullWidth
                  autoComplete="organization"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="type-label">Type *</InputLabel>
                  <Select
                    labelId="type-label"
                    label="Type *"
                    value={props.draft.type}
                    onChange={(e) =>
                      props.onDraftChange({ ...props.draft, type: e.target.value as AccountType })
                    }
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <MenuItem value={t} key={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Account Number *"
                  value={props.draft.accountNumber}
                  onChange={(e) => props.onDraftChange({ ...props.draft, accountNumber: e.target.value })}
                  fullWidth
                  inputMode="numeric"
                  autoComplete={props.draft.type === 'Credit Card' ? 'cc-number' : 'off'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Current Card Number"
                  value={props.draft.currentCardNumber}
                  onChange={(e) => props.onDraftChange({ ...props.draft, currentCardNumber: e.target.value })}
                  onBlur={() => {
                    if (!cardParsed) return
                    if (props.draft.currentCardNumber !== cardParsed.formatted) {
                      props.onDraftChange({ ...props.draft, currentCardNumber: cardParsed.formatted })
                    }
                  }}
                  fullWidth
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="(optional)"
                  helperText={cardParsed ? `Detected: ${cardParsed.brand}` : ' '}
                  InputProps={{
                    startAdornment: cardParsed ? (
                      <InputAdornment position="start">
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 22,
                            px: 1,
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: 0.2,
                            color: 'text.primary',
                            backgroundColor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cardParsed.brand === 'American Express' ? 'AMEX' : cardParsed.brand.toUpperCase()}
                        </Box>
                      </InputAdornment>
                    ) : undefined,
                  }}
                />
              </Grid>

              {props.draft.type === 'Credit Card' ? (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Credit Limit"
                    value={props.draft.creditLimit}
                    onChange={(e) => props.onDraftChange({ ...props.draft, creditLimit: e.target.value })}
                    fullWidth
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="(optional)"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    helperText={
                      creditLimitNum != null
                        ? `Available credit: ${formatMoney(availCredit ?? 0)}`
                        : 'Optional. Used to calculate available credit.'
                    }
                  />
                </Grid>
              ) : null}

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Account Open Date"
                  type="date"
                  value={props.draft.openDate}
                  onChange={(e) => props.onDraftChange({ ...props.draft, openDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText={ageLabel ? `Age: ${ageLabel}` : ' '}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Interest Rate (APR %)"
                  value={props.draft.interestRateApr}
                  onChange={(e) => props.onDraftChange({ ...props.draft, interestRateApr: e.target.value })}
                  fullWidth
                  inputMode="decimal"
                  autoComplete="off"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Service Fee"
                  value={props.draft.serviceFeeAmount}
                  onChange={(e) => props.onDraftChange({ ...props.draft, serviceFeeAmount: e.target.value })}
                  fullWidth
                  inputMode="decimal"
                  autoComplete="off"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="fee-freq-label">Fee Frequency</InputLabel>
                  <Select
                    labelId="fee-freq-label"
                    label="Fee Frequency"
                    value={props.draft.serviceFeeFrequency}
                    onChange={(e) =>
                      props.onDraftChange({
                        ...props.draft,
                        serviceFeeFrequency: e.target.value as AccountDraft['serviceFeeFrequency'],
                      })
                    }
                  >
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Current Balance *"
                  value={props.draft.currentBalance}
                  onChange={(e) => props.onDraftChange({ ...props.draft, currentBalance: e.target.value })}
                  fullWidth
                  inputMode="decimal"
                  autoComplete="off"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Actual Last Min Payment"
                  value={props.draft.actualLastMinPayment}
                  onChange={(e) =>
                    props.onDraftChange({ ...props.draft, actualLastMinPayment: e.target.value })
                  }
                  fullWidth
                  inputMode="decimal"
                  autoComplete="off"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  helperText={`Estimated (if blank): ${formatMoney(estimatedMin)}`}
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="h6" fontWeight={900}>
              Login info
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Account Login URL"
                  value={props.draft.loginUrl}
                  onChange={(e) => props.onDraftChange({ ...props.draft, loginUrl: e.target.value })}
                  fullWidth
                  type="url"
                  autoComplete="url"
                  placeholder="https://…"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Account Username"
                  value={props.draft.username}
                  onChange={(e) => props.onDraftChange({ ...props.draft, username: e.target.value })}
                  fullWidth
                  autoComplete="username"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Account Password (encrypted)"
                  value={passwordPlain}
                  onChange={(e) => setPasswordPlain(e.target.value)}
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={props.existing?.passwordEnc ? 'Stored (encrypted). Type to replace…' : 'Type to store…'}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" spacing={1}>
                          {props.existing?.passwordEnc ? (
                            <Button
                              size="small"
                              variant="text"
                              disabled={pwBusy}
                              onClick={revealExistingPassword}
                              startIcon={<VisibilityIcon />}
                            >
                              Reveal
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setShowPassword((x) => !x)}
                            startIcon={showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </Button>
                        </Stack>
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    passwordError ??
                    (vault.status === 'unlocked'
                      ? 'To keep existing password, leave blank.'
                      : 'Unlock the vault to view/save passwords.')
                  }
                  error={Boolean(passwordError)}
                />
              </Grid>
            </Grid>

            <TextField
              label="Notes"
              value={props.draft.notes}
              onChange={(e) => props.onDraftChange({ ...props.draft, notes: e.target.value })}
              fullWidth
              multiline
              minRows={3}
              autoComplete="off"
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={900}>
              Estimates
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Estimated payoff
              </Typography>
              {payoff.kind === 'estimate' ? (
                <>
                  <Typography variant="h6" fontWeight={900}>
                    {payoff.months} months
                  </Typography>
                  <Typography color="text.secondary">
                    Total interest ~ {formatMoney(payoff.totalInterest)}
                  </Typography>
                </>
              ) : payoff.kind === 'never' ? (
                <Typography color="text.secondary">{payoff.reason}</Typography>
              ) : (
                <Typography color="text.secondary">—</Typography>
              )}
            </Box>

            {props.existing?.passwordEnc ? (
              <Alert severity="info">
                Password is stored encrypted. Use “Reveal” (vault required) to view it.
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                disabled={requiredMissing}
                onClick={save}
              >
                Save
              </Button>
              {props.existing?.loginUrl ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigator.clipboard.writeText(props.existing?.loginUrl ?? '')}
                  startIcon={<ContentCopyIcon />}
                >
                  Copy URL
                </Button>
              ) : (
                <Button fullWidth variant="outlined" disabled>
                  Copy URL
                </Button>
              )}
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

