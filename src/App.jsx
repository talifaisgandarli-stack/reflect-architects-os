import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LayihelerPage from './pages/LayihelerPage'
import TapshiriqlarPage from './pages/TapshiriqlarPage'
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
              <Route path="sifarisci-idareetme" element={<CS t="Sifarişçi İdarəetməsi" />} />
              <Route path="pipeline" element={<CS t="Sifarişçi Pipeline" />} />
              <Route path="kommersiya-teklifleri" element={<CS t="Kommersiya Təklifləri" />} />
              <Route path="muqavileler" element={<CS t="Müqavilələr" />} />
              <Route path="portfel" element={<CS t="Portfel" />} />
              <Route path="daxilolmalar" element={<CS t="Daxilolmalar" />} />
              <Route path="hesab-fakturalar" element={<CS t="Hesab-fakturalar" />} />
              <Route path="xercler" element={<CS t="Xərclər" />} />
              <Route path="podrat-isleri" element={<CS t="Podrat İşləri" />} />
              <Route path="debitor-borclar" element={<CS t="Debitor Borclar" />} />
              <Route path="daxili-kocurmeler" element={<CS t="Daxili Köçürmələr" />} />
              <Route path="tesisci-borclari" element={<CS t="Təsisçi Borcları" />} />
              <Route path="hesabatlar" element={<CS t="Hesabatlar" />} />
              <Route path="sabit-xercler" element={<CS t="Sabit Xərclər" />} />
              <Route path="isci-heyeti" element={<CS t="İşçi Heyəti" />} />
              <Route path="emek-haqqi" element={<CS t="Əmək haqqı" />} />
              <Route path="elanlar" element={<CS t="Elanlar Lövhəsi" />} />
              <Route path="hadiseler" element={<CS t="Hadisələr Təqvimi" />} />
              <Route path="mezuniyyet" element={<CS t="Məzuniyyət Cədvəli" />} />
              <Route path="avadanliq" element={<CS t="Avadanlıq" />} />
              <Route path="hedef-netice" element={<CS t="Hədəf və Nəticələr" />} />
              <Route path="mezmun-planlamasi" element={<CS t="Məzmun Planlaması" />} />
              <Route path="sened-arxivi" element={<CS t="Sənəd Arxivi" />} />
              <Route path="qaynaqlar" element={<CS t="Qaynaqlar" />} />
              <Route path="parametrler" element={<CS t="Parametrlər" />} />
              <Route path="sistem-arxivi" element={<CS t="Sistem Arxivi" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
