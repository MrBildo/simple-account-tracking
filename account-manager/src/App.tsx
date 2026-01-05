import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { AccountsPage } from './pages/AccountsPage'
import { AccountDetailPage } from './pages/AccountDetailPage'
import { OverviewPage } from './pages/OverviewPage'
import { AppStoreProvider } from './store/AppStoreProvider'

export default function App() {
  return (
    <AppStoreProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/new" element={<AccountDetailPage />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AppStoreProvider>
  )
}
