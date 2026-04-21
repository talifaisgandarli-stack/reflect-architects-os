import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LayihelerPage from './pages/LayihelerPage'
import TapshiriqlarPage from './pages/TapshiriqlarPage'
import PipelinePage from './pages/PipelinePage'
import SifarisciIdareetmesiPage from './pages/SifarisciIdareetmesiPage'
import KommersiyaTeklifleriPage from './pages/KommersiyaTeklifleriPage'
import MuqavilelerPage from './pages/MuqavilelerPage'
import PortfelPage from './pages/PortfelPage'
import DaxilolmalarPage from './pages/DaxilolmalarPage'
import HesabFakturalarPage from './pages/HesabFakturalarPage'
import XerclerPage from './pages/XerclerPage'
import PodratIsleriPage from './pages/PodratIsleriPage'
import DebitorBorclarPage from './pages/DebitorBorclarPage'
import DaxiliKocurmelePage from './pages/DaxiliKocurmelePage'
import TesisciBorclarPage from './pages/TesisciBorclarPage'
import SabitXerclerPage from './pages/SabitXerclerPage'
import IshciHeyetiPage from './pages/IshciHeyetiPage'
import ParametrlerPage from './pages/ParametrlerPage'
import HesabatlarPage from './pages/HesabatlarPage'
import ElanlarLovhesiPage from './pages/ElanlarLovhesiPage'
import HadiselerTeqvimiPage from './pages/HadiselerTeqvimiPage'
import MezuniyyetCedveliPage from './pages/MezuniyyetCedveliPage'
import AvadanliqPage from './pages/AvadanliqPage'
import ComingSoonPage from './pages/ComingSoonPage'

function CS({ t }) { return <ComingSoonPage title={t} /> }

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/giris" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="layiheler" element={<LayihelerPage />} />
              <Route path="tapshiriqlar" element={<TapshiriqlarPage />} />
              <Route path="is-ucotu" element={<CS t="İş Uçotu" />} />
              <Route path="icazeler" element={<CS t="İcazə və Razılaşmalar" />} />
              <Route path="sifarisci-idareetme" element={<SifarisciIdareetmesiPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="kommersiya-teklifleri" element={<KommersiyaTeklifleriPage />} />
              <Route path="muqavileler" element={<MuqavilelerPage />} />
              <Route path="portfel" element={<PortfelPage />} />
              <Route path="daxilolmalar" element={<DaxilolmalarPage />} />
              <Route path="hesab-fakturalar" element={<HesabFakturalarPage />} />
              <Route path="xercler" element={<XerclerPage />} />
              <Route path="podrat-isleri" element={<PodratIsleriPage />} />
              <Route path="debitor-borclar" element={<DebitorBorclarPage />} />
              <Route path="daxili-kocurmeler" element={<DaxiliKocurmelePage />} />
              <Route path="tesisci-borclari" element={<TesisciBorclarPage />} />
              <Route path="hesabatlar" element={<HesabatlarPage />} />
              <Route path="sabit-xercler" element={<SabitXerclerPage />} />
              <Route path="isci-heyeti" element={<IshciHeyetiPage />} />
              <Route path="emek-haqqi" element={<CS t="Əmək haqqı" />} />
              <Route path="elanlar" element={<ElanlarLovhesiPage />} />
              <Route path="hadiseler" element={<HadiselerTeqvimiPage />} />
              <Route path="mezuniyyet" element={<MezuniyyetCedveliPage />} />
              <Route path="avadanliq" element={<AvadanliqPage />} />
              <Route path="hedef-netice" element={<CS t="Hədəf və Nəticələr" />} />
              <Route path="mezmun-planlamasi" element={<CS t="Məzmun Planlaması" />} />
              <Route path="sened-arxivi" element={<CS t="Sənəd Arxivi" />} />
              <Route path="qaynaqlar" element={<CS t="Qaynaqlar" />} />
              <Route path="parametrler" element={<ParametrlerPage />} />
              <Route path="sistem-arxivi" element={<CS t="Sistem Arxivi" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
