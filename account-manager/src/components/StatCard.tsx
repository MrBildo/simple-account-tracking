import { Card, CardContent, Typography } from '@mui/material'

export function StatCard(props: { label: string; value: string; helper?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {props.label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {props.value}
        </Typography>
        {props.helper ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {props.helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}

