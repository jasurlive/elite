import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import '../css/reset.css'
import '../css/theme.css'
import '../css/page.css'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Plan from '../pages/Plan'

// add a page: create it in pages, add a <Route> here and an item in Menu.tsx
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="plan" element={<Plan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
