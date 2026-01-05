import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { AccountRecord } from '../lib/types'
import { availableCredit, estimateMinPayment, formatMoney, payoffEstimate } from '../lib/math'

export function AccountsTable(props: { accounts: AccountRecord[] }) {
  return (
    <Table size="small" sx={{ '& tbody tr': { cursor: 'pointer' } }}>
      <TableHead>
        <TableRow>
          <TableCell>Account</TableCell>
          <TableCell>Type</TableCell>
          <TableCell align="right">Balance</TableCell>
          <TableCell align="right">Min payment</TableCell>
          <TableCell align="right">Available / Limit</TableCell>
          <TableCell>Payoff</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.accounts.map((a) => {
          const payment = a.actualLastMinPayment ?? estimateMinPayment(a.currentBalance || 0)
          const payoff = payoffEstimate({
            balance: a.currentBalance || 0,
            aprPercent: a.interestRateApr,
            monthlyPayment: payment,
          })
          const avail = availableCredit(a)
          const payoffLabel =
            payoff.kind === 'estimate'
              ? `${payoff.months} mo`
              : payoff.kind === 'never'
                ? payoff.reason
                : '—'

          return (
            <TableRow
              key={a.id}
              hover
              component={RouterLink}
              to={`/accounts/${a.id}`}
              sx={{ textDecoration: 'none' }}
            >
              <TableCell>
                <Typography fontWeight={800}>{a.accountName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.accountNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip size="small" label={a.type} variant="outlined" />
              </TableCell>
              <TableCell align="right">{formatMoney(a.currentBalance || 0)}</TableCell>
              <TableCell align="right">
                {a.actualLastMinPayment != null ? (
                  <>
                    {formatMoney(a.actualLastMinPayment)}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      actual
                    </Typography>
                  </>
                ) : (
                  <>
                    {formatMoney(payment)}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      estimated
                    </Typography>
                  </>
                )}
              </TableCell>
              <TableCell align="right">
                {a.creditLimit != null ? (
                  <>
                    <Typography variant="body2" fontWeight={800}>
                      {formatMoney(avail ?? 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      / {formatMoney(a.creditLimit)}
                    </Typography>
                  </>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">{payoffLabel}</Typography>
                {payoff.kind === 'estimate' ? (
                  <Typography variant="caption" color="text.secondary">
                    est. interest {formatMoney(payoff.totalInterest)}
                  </Typography>
                ) : null}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

