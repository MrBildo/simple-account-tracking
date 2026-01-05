import { Box, Button, Stack, Typography, Grid } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink } from 'react-router-dom'
import { StatCard } from '../components/StatCard'
import { useAppStore } from '../store/useAppStore'
import { effectiveMonthlyServiceFee, estimateMinPayment, formatMoney } from '../lib/math'

export function OverviewPage() {
  const { accounts } = useAppStore()

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0)
  const totalMonthlyServiceFees = accounts.reduce((sum, a) => sum + effectiveMonthlyServiceFee(a), 0)
  const totalMinDueEstimate = accounts.reduce((sum, a) => {
    const payment = a.actualLastMinPayment ?? estimateMinPayment(a.currentBalance || 0)
    return sum + payment
  }, 0)
  const biggest = accounts.reduce(
    (acc, a) => (a.currentBalance > (acc?.currentBalance ?? -Infinity) ? a : acc),
    undefined as (typeof accounts)[number] | undefined,
  )

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2} mb={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={900}>
            Overview
          </Typography>
          <Typography color="text.secondary">
            Quick totals and estimates (based on your latest entries).
          </Typography>
        </Box>
        <Button component={RouterLink} to="/accounts/new" startIcon={<AddIcon />}>
          Add account
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Total balance" value={formatMoney(totalBalance)} helper={`${accounts.length} accounts`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Est. min due (monthly)"
            value={formatMoney(totalMinDueEstimate)}
            helper="Uses actual last min payment when provided"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Est. service fees (monthly)" value={formatMoney(totalMonthlyServiceFees)} helper="Yearly fees divided by 12" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Largest balance"
            value={biggest ? formatMoney(biggest.currentBalance) : formatMoney(0)}
            helper={biggest ? biggest.accountName : '—'}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

