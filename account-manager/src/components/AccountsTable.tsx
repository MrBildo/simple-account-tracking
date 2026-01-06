import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { AccountRecord } from '../lib/types'
import { availableCredit, estimateMinPayment, formatMoney, payoffEstimate } from '../lib/math'

export function AccountsTable(props: { accounts: AccountRecord[] }) {
  type SortKey = 'account' | 'balance' | 'minPayment'
  type SortOrder = 'asc' | 'desc'

  const [orderBy, setOrderBy] = useState<SortKey>('account')
  const [order, setOrder] = useState<SortOrder>('asc')

  function toggleSort(nextKey: SortKey) {
    if (orderBy === nextKey) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
      return
    }
    setOrderBy(nextKey)
    setOrder('asc')
  }

  const sorted = useMemo(() => {
    const dir = order === 'asc' ? 1 : -1
    const list = [...props.accounts]

    function minPayment(a: AccountRecord) {
      return a.actualLastMinPayment ?? estimateMinPayment(a.currentBalance || 0)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (orderBy === 'account') {
        cmp = a.accountName.localeCompare(b.accountName, undefined, { sensitivity: 'base' })
      } else if (orderBy === 'balance') {
        cmp = (a.currentBalance || 0) - (b.currentBalance || 0)
      } else {
        cmp = minPayment(a) - minPayment(b)
      }

      if (cmp !== 0) return cmp * dir
      // Tie-breaker: stable-ish and predictable
      return a.accountName.localeCompare(b.accountName, undefined, { sensitivity: 'base' })
    })

    return list
  }, [order, orderBy, props.accounts])

  return (
    <Table size="small" sx={{ '& tbody tr': { cursor: 'pointer' } }}>
      <TableHead>
        <TableRow>
          <TableCell sortDirection={orderBy === 'account' ? order : false}>
            <TableSortLabel
              active={orderBy === 'account'}
              direction={orderBy === 'account' ? order : 'asc'}
              onClick={() => toggleSort('account')}
            >
              Account
            </TableSortLabel>
          </TableCell>
          <TableCell>Type</TableCell>
          <TableCell align="right" sortDirection={orderBy === 'balance' ? order : false}>
            <TableSortLabel
              active={orderBy === 'balance'}
              direction={orderBy === 'balance' ? order : 'asc'}
              onClick={() => toggleSort('balance')}
            >
              Balance
            </TableSortLabel>
          </TableCell>
          <TableCell align="right" sortDirection={orderBy === 'minPayment' ? order : false}>
            <TableSortLabel
              active={orderBy === 'minPayment'}
              direction={orderBy === 'minPayment' ? order : 'asc'}
              onClick={() => toggleSort('minPayment')}
            >
              Min payment
            </TableSortLabel>
          </TableCell>
          <TableCell align="right">Available / Limit</TableCell>
          <TableCell>Payoff</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((a) => {
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

