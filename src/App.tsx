import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { ChildDetail } from './pages/ChildDetail'
import { ChildForm } from './pages/ChildForm'
import { Home } from './pages/Home'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/criancas/nova" element={<ChildForm />} />
        <Route path="/criancas/:id" element={<ChildDetail />} />
        <Route path="/criancas/:id/editar" element={<ChildForm key="edit" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
