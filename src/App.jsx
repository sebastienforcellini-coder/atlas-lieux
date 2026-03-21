import { Routes, Route } from 'react-router-dom'
import Topbar from './components/Topbar'
import { ToastProvider } from './hooks/useToast'
import Home from './pages/Home'
import AllPlaces from './pages/AllPlaces'
import Country from './pages/Country'
import City from './pages/City'
import Detail from './pages/Detail'
import Form from './pages/Form'

export default function App() {
  return (
    <ToastProvider>
      <Topbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lieux" element={<AllPlaces />} />
        <Route path="/pays/:country" element={<Country />} />
        <Route path="/pays/:country/ville/:city" element={<City />} />
        <Route path="/lieu/nouveau" element={<Form />} />
        <Route path="/lieu/:id" element={<Detail />} />
        <Route path="/lieu/:id/modifier" element={<Form />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </ToastProvider>
  )
}
