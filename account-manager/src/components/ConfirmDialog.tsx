import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

export function ConfirmDialog(props: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{props.description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={props.onClose}>
          {props.cancelLabel ?? 'Cancel'}
        </Button>
        <Button color="error" onClick={props.onConfirm}>
          {props.confirmLabel ?? 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

