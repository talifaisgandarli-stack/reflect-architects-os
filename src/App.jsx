import { lazy, Suspense } from 'react'
import { useAuth } from './contexts/AuthContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'

const DashboardPage          = lazy(() => import('./pages/DashboardPage'))
const EmployeeDashboardPage  = lazy(() => import('./pages/EmployeeDashboardPage'))
const LayihelerPage          = lazy(() => import('./pages/LayihelerPage'))
const TapshiriqlarPage       = lazy(() => import('./pages/TapshiriqlarPage'))
const PipelinePage           = lazy(() => import('./pages/PipelinePage'))
const SifarisciIdareetmesiPage = lazy(() => import('./pages/SifarisciIdareetmesiPage'))
const KommersiyaTeklifleriPage = lazy(() => import('./pages/KommersiyaTeklifleriPage'))
const MuqavilelerPage        = lazy(() => import('./pages/MuqavilelerPage'))
const PortfelPage            = lazy(() => import('./pages/PortfelPage'))
const DaxilolmalarPage       = lazy(() => import('./pages/DaxilolmalarPage'))
const HesabFakturalarPage    = lazy(() => import('./pages/HesabFakturalarPage'))
const XerclerPage            = lazy(() => import('./pages/XerclerPage'))
const PodratIsleriPage       = lazy(() => import('./pages/PodratIsleriPage'))
const DebitorBorclarPage     = lazy(() => import('./pages/DebitorBorclarPage'))
const DaxiliKocurmelePage    = lazy(() => import('./pages/DaxiliKocurmelePage'))
const TesisciBorclarPage     = lazy(() => import('./pages/TesisciBorclarPage'))
const SabitXerclerPage       = lazy(() => import('./pages/SabitXerclerPage'))
const IshciHeyetiPage        = lazy(() => import('./pages/IshciHeyetiPage'))
const EmekHaqqiPage          = lazy(() => import('./pages/EmekHaqqiPage'))
const ParametrlerPage        = lazy(() => import('./pages/ParametrlerPage'))
const HesabatlarPage         = lazy(() => import('./pages/HesabatlarPage'))
const ElanlarLovhesiPage     = lazy(() => import('./pages/ElanlarLovhesiPage'))
const HadiselerTeqvimiPage   = lazy(() => import('./pages/HadiselerTeqvimiPage'))
const MezuniyyetCedveliPage  = lazy(() => import('./pages/MezuniyyetCedveliPage'))
const AvadanliqPage          = lazy(() => import('./pages/AvadanliqPage'))
const HedefNeticeOKRPage     = lazy(() => import('./pages/HedefNeticeOKRPage'))
const MezmunPlanlamasiPage   = lazy(() => import('./pages/MezmunPlanlamasiPage'))
const SendArxiviPage         = lazy(() => import('./pages/SendArxiviPage'))
const QaynaqlarPage          = lazy(() => import('./pages/QaynaqlarPage'))
const PerformansPage         = lazy(() => import('./pages/PerformansPage'))
const HierarchyPage          = lazy(() => import('./pages/HierarchyPage'))
const ComingSoonPage         = lazy(() => import('./pages/ComingSoonPage'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#bbb]">Yüklənir...</span>
      </div>
    </div>
  )
}

function CS({ t }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ComingSoonPage title={t} />
    </Suspense>
  )
}

function RoleBasedDashboard() {
  const { isAdmin } = useAuth()
  return isAdmin ? <DashboardPage /> : <EmployeeDashboardPage />
}

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
              <Route index element={
                <Suspense fallback={<PageLoader />}><RoleBasedDashboard /></Suspense>
              } />
              <Route path="employee-dashboard" element={<Suspense fallback={<PageLoader />}><EmployeeDashboardPage /></Suspense>} />
              <Route path="layiheler"             element={<Suspense fallback={<PageLoader />}><LayihelerPage /></Suspense>} />
              <Route path="tapshiriqlar"          element={<Suspense fallback={<PageLoader />}><TapshiriqlarPage /></Suspense>} />
              <Route path="icazeler"              element={<CS t="İcazə və Razılaşmalar" />} />
              <Route path="sifarisci-idareetme"   element={<Suspense fallback={<PageLoader />}><SifarisciIdareetmesiPage /></Suspense>} />
              <Route path="pipeline"              element={<Suspense fallback={<PageLoader />}><PipelinePage /></Suspense>} />
              <Route path="kommersiya-teklifleri" element={<Suspense fallback={<PageLoader />}><KommersiyaTeklifleriPage /></Suspense>} />
              <Route path="muqavileler"           element={<Suspense fallback={<PageLoader />}><MuqavilelerPage /></Suspense>} />
              <Route path="portfel"               element={<Suspense fallback={<PageLoader />}><PortfelPage /></Suspense>} />
              <Route path="daxilolmalar"          element={<Suspense fallback={<PageLoader />}><DaxilolmalarPage /></Suspense>} />
              <Route path="hesab-fakturalar"      element={<Suspense fallback={<PageLoader />}><HesabFakturalarPage /></Suspense>} />
              <Route path="xercler"               element={<Suspense fallback={<PageLoader />}><XerclerPage /></Suspense>} />
              <Route path="podrat-isleri"         element={<Suspense fallback={<PageLoader />}><PodratIsleriPage /></Suspense>} />
              <Route path="debitor-borclar"       element={<Suspense fallback={<PageLoader />}><DebitorBorclarPage /></Suspense>} />
              <Route path="daxili-kocurmeler"     element={<Suspense fallback={<PageLoader />}><DaxiliKocurmelePage /></Suspense>} />
              <Route path="tesisci-borclari"      element={<Suspense fallback={<PageLoader />}><TesisciBorclarPage /></Suspense>} />
              <Route path="hesabatlar"            element={<Suspense fallback={<PageLoader />}><HesabatlarPage /></Suspense>} />
              <Route path="sabit-xercler"         element={<Suspense fallback={<PageLoader />}><SabitXerclerPage /></Suspense>} />
              <Route path="isci-heyeti"           element={<Suspense fallback={<PageLoader />}><IshciHeyetiPage /></Suspense>} />
              <Route path="emek-haqqi"            element={<Suspense fallback={<PageLoader />}><EmekHaqqiPage /></Suspense>} />
              <Route path="performans"            element={<Suspense fallback={<PageLoader />}><PerformansPage /></Suspense>} />
              <Route path="karyera-strukturu"     element={<Suspense fallback={<PageLoader />}><HierarchyPage /></Suspense>} />
              <Route path="elanlar"               element={<Suspense fallback={<PageLoader />}><ElanlarLovhesiPage /></Suspense>} />
              <Route path="hadiseler"             element={<Suspense fallback={<PageLoader />}><HadiselerTeqvimiPage /></Suspense>} />
              <Route path="mezuniyyet"            element={<Suspense fallback={<PageLoader />}><MezuniyyetCedveliPage /></Suspense>} />
              <Route path="avadanliq"             element={<Suspense fallback={<PageLoader />}><AvadanliqPage /></Suspense>} />
              <Route path="hedef-netice"          element={<Suspense fallback={<PageLoader />}><HedefNeticeOKRPage /></Suspense>} />
              <Route path="mezmun-planlamasi"     element={<Suspense fallback={<PageLoader />}><MezmunPlanlamasiPage /></Suspense>} />
              <Route path="sened-arxivi"          element={<Suspense fallback={<PageLoader />}><SendArxiviPage /></Suspense>} />
              <Route path="qaynaqlar"             element={<Suspense fallback={<PageLoader />}><QaynaqlarPage /></Suspense>} />
              <Route path="parametrler"           element={<Suspense fallback={<PageLoader />}><ParametrlerPage /></Suspense>} />
              <Route path="sistem-arxivi"         element={<CS t="Sistem Arxivi" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
